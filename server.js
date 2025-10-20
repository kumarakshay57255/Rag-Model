import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadWebPage, loadCSV, loadJSON, loadTextFile, splitDocuments } from './documentLoaders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static('public'));

// Configure file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'text/csv',
            'application/json',
            'text/plain',
            'text/markdown',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type! Supported: PDF, CSV, JSON, TXT, MD'), false);
        }
    },
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        fieldSize: 100 * 1024 * 1024  // 100MB field size
    }
});

// Global embedding model (cached)
let embeddingModel = null;

// Initialize Gemini LLM
let geminiModel = null;

function getGeminiLLM() {
    if (!geminiModel && process.env.GEMINI_API_KEY) {
        console.log('Initializing Google Gemini...');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Use gemini-2.5-flash - stable version released in June 2025
        geminiModel = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        });
        console.log('✓ Gemini LLM ready');
    }
    return geminiModel;
}

// Initialize embedding model
async function getEmbeddingModel() {
    if (!embeddingModel) {
        console.log('Initializing embedding model...');
        embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✓ Embedding model ready');
    }
    return embeddingModel;
}

// Load vector store
function loadVectorStore() {
    const vectorStoreFile = './vector_store/embeddings.json';
    if (!fs.existsSync(vectorStoreFile)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(vectorStoreFile, 'utf-8'));
}

// Save vector store
function saveVectorStore(data) {
    const vectorStoreDir = './vector_store';
    if (!fs.existsSync(vectorStoreDir)) {
        fs.mkdirSync(vectorStoreDir, { recursive: true });
    }
    fs.writeFileSync(
        path.join(vectorStoreDir, 'embeddings.json'),
        JSON.stringify(data, null, 2)
    );
}

// Cosine similarity
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// ============= API ROUTES =============

// Home route - serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get vector store stats
app.get('/api/stats', (req, res) => {
    try {
        const vectorStore = loadVectorStore();
        if (!vectorStore) {
            return res.json({
                totalDocuments: 0,
                totalChunks: 0,
                files: []
            });
        }

        res.json({
            totalDocuments: vectorStore.metadata.sourceFiles.length,
            totalChunks: vectorStore.metadata.totalChunks,
            dimensions: vectorStore.metadata.dimensions,
            model: vectorStore.metadata.model,
            createdAt: vectorStore.metadata.createdAt,
            files: vectorStore.metadata.sourceFiles
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload and process files (PDF, CSV, JSON, TXT)
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`Processing file: ${req.file.originalname}`);

        let docs;
        const fileExtension = path.extname(req.file.originalname).toLowerCase();

        // Load document based on file type
        switch (fileExtension) {
            case '.pdf':
                const pdfLoader = new PDFLoader(req.file.path);
                docs = await pdfLoader.load();
                console.log(`✓ Loaded ${docs.length} pages from PDF`);
                break;
            case '.csv':
                docs = await loadCSV(req.file.path);
                console.log(`✓ Loaded ${docs.length} rows from CSV`);
                break;
            case '.json':
                docs = await loadJSON(req.file.path);
                console.log(`✓ Loaded ${docs.length} items from JSON`);
                break;
            case '.txt':
            case '.md':
                docs = await loadTextFile(req.file.path);
                console.log(`✓ Loaded text file`);
                break;
            default:
                return res.status(400).json({ error: `Unsupported file type: ${fileExtension}` });
        }

        // Split into chunks
        const splitDocs = await splitDocuments(docs, 1000, 200);
        console.log(`✓ Created ${splitDocs.length} chunks`);

        // Get embedding model
        const model = await getEmbeddingModel();

        // Create embeddings
        const documentEmbeddings = [];
        for (let i = 0; i < splitDocs.length; i++) {
            const doc = splitDocs[i];
            const output = await model(doc.pageContent, { pooling: 'mean', normalize: true });
            const embedding = Array.from(output.data);

            documentEmbeddings.push({
                content: doc.pageContent,
                embedding: embedding,
                metadata: {
                    ...doc.metadata,
                    originalName: req.file.originalname,
                    fileType: fileExtension,
                    uploadedAt: new Date().toISOString()
                },
                chunkIndex: i
            });
        }
        console.log(`✓ Created embeddings for ${documentEmbeddings.length} chunks`);

        // Load existing vector store or create new one
        let vectorStore = loadVectorStore();
        if (!vectorStore) {
            vectorStore = {
                embeddings: [],
                metadata: {
                    totalChunks: 0,
                    dimensions: 384,
                    model: 'Xenova/all-MiniLM-L6-v2',
                    createdAt: new Date().toISOString(),
                    sourceFiles: []
                }
            };
        }

        // Add new embeddings
        vectorStore.embeddings.push(...documentEmbeddings);
        vectorStore.metadata.totalChunks = vectorStore.embeddings.length;
        vectorStore.metadata.sourceFiles.push({
            name: req.file.originalname,
            type: fileExtension,
            uploadedAt: new Date().toISOString()
        });

        // Save vector store
        saveVectorStore(vectorStore);
        console.log(`✓ Vector store updated`);

        res.json({
            success: true,
            message: 'File processed successfully',
            filename: req.file.originalname,
            fileType: fileExtension,
            documents: docs.length,
            chunks: splitDocs.length,
            totalChunks: vectorStore.metadata.totalChunks
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Process URL endpoint
app.post('/api/process-url', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return res.status(400).json({ error: 'Invalid URL. Must start with http:// or https://' });
        }

        console.log(`Processing URL: ${url}`);

        // Load webpage content
        const docs = await loadWebPage(url);
        console.log(`✓ Loaded content from ${url}`);

        // Split into chunks
        const splitDocs = await splitDocuments(docs, 1000, 200);
        console.log(`✓ Created ${splitDocs.length} chunks`);

        // Get embedding model
        const model = await getEmbeddingModel();

        // Create embeddings
        const documentEmbeddings = [];
        for (let i = 0; i < splitDocs.length; i++) {
            const doc = splitDocs[i];
            const output = await model(doc.pageContent, { pooling: 'mean', normalize: true });
            const embedding = Array.from(output.data);

            documentEmbeddings.push({
                content: doc.pageContent,
                embedding: embedding,
                metadata: {
                    ...doc.metadata,
                    source: url,
                    sourceType: 'url',
                    uploadedAt: new Date().toISOString()
                },
                chunkIndex: i
            });
        }
        console.log(`✓ Created embeddings for ${documentEmbeddings.length} chunks`);

        // Load existing vector store or create new one
        let vectorStore = loadVectorStore();
        if (!vectorStore) {
            vectorStore = {
                embeddings: [],
                metadata: {
                    totalChunks: 0,
                    dimensions: 384,
                    model: 'Xenova/all-MiniLM-L6-v2',
                    createdAt: new Date().toISOString(),
                    sourceFiles: []
                }
            };
        }

        // Add new embeddings
        vectorStore.embeddings.push(...documentEmbeddings);
        vectorStore.metadata.totalChunks = vectorStore.embeddings.length;
        vectorStore.metadata.sourceFiles.push({
            name: url,
            type: 'url',
            uploadedAt: new Date().toISOString()
        });

        // Save vector store
        saveVectorStore(vectorStore);
        console.log(`✓ Vector store updated`);

        res.json({
            success: true,
            message: 'URL processed successfully',
            url: url,
            chunks: splitDocs.length,
            totalChunks: vectorStore.metadata.totalChunks
        });

    } catch (error) {
        console.error('URL processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Query endpoint
app.post('/api/query', async (req, res) => {
    try {
        const { query, topK = 3 } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Load vector store
        const vectorStore = loadVectorStore();
        if (!vectorStore || vectorStore.embeddings.length === 0) {
            return res.json({
                query: query,
                results: [],
                message: 'No documents in vector store. Please upload some documents first.'
            });
        }

        console.log(`Query: "${query}"`);

        // Get embedding model
        const model = await getEmbeddingModel();

        // Create query embedding
        const queryOutput = await model(query, { pooling: 'mean', normalize: true });
        const queryEmbedding = Array.from(queryOutput.data);

        // Calculate similarities
        const similarities = vectorStore.embeddings.map(doc => ({
            content: doc.content,
            metadata: doc.metadata,
            chunkIndex: doc.chunkIndex,
            similarity: cosineSimilarity(queryEmbedding, doc.embedding)
        }));

        // Sort by similarity
        similarities.sort((a, b) => b.similarity - a.similarity);

        // Get top K results
        const topResults = similarities.slice(0, topK);

        console.log(`✓ Found ${topResults.length} results`);

        res.json({
            query: query,
            results: topResults.map(r => ({
                content: r.content,
                source: r.metadata.originalName || r.metadata.source,
                page: r.metadata.loc?.pageNumber || 'N/A',
                similarity: (r.similarity * 100).toFixed(2),
                chunkIndex: r.chunkIndex
            })),
            totalDocuments: vectorStore.metadata.sourceFiles.length
        });

    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: error.message });
    }
});

// AI-powered answer endpoint using DeepSeek
app.post('/api/query-ai', async (req, res) => {
    try {
        const { query, topK = 3 } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Check if Gemini API key is available
        if (!process.env.GEMINI_API_KEY) {
            return res.status(400).json({
                error: 'Gemini API key not configured. Please add GEMINI_API_KEY to .env file'
            });
        }

        // Load vector store
        const vectorStore = loadVectorStore();
        if (!vectorStore || vectorStore.embeddings.length === 0) {
            return res.json({
                query: query,
                answer: 'No documents in vector store. Please upload some documents first.',
                results: []
            });
        }

        console.log(`AI Query: "${query}"`);

        // Get embedding model
        const model = await getEmbeddingModel();

        // Create query embedding
        const queryOutput = await model(query, { pooling: 'mean', normalize: true });
        const queryEmbedding = Array.from(queryOutput.data);

        // Calculate similarities
        const similarities = vectorStore.embeddings.map(doc => ({
            content: doc.content,
            metadata: doc.metadata,
            chunkIndex: doc.chunkIndex,
            similarity: cosineSimilarity(queryEmbedding, doc.embedding)
        }));

        // Sort by similarity
        similarities.sort((a, b) => b.similarity - a.similarity);

        // Get top K results
        const topResults = similarities.slice(0, topK);

        console.log(`✓ Retrieved ${topResults.length} relevant chunks`);

        // Prepare context for Gemini
        const context = topResults
            .map((doc, index) => `[Document ${index + 1}] ${doc.content}`)
            .join('\n\n');

        // Get Gemini LLM
        const gemini = getGeminiLLM();

        // Create prompt
        const prompt = `You are a helpful assistant. Use the following context from documents to answer the user's question. If the answer cannot be found in the context, say so clearly.

Context from documents:
${context}

Question: ${query}

Answer:`;

        console.log('✓ Generating AI answer with Google Gemini...');

        // Generate answer using Gemini
        const result = await gemini.generateContent(prompt);
        const response = await result.response;
        const answer = response.text();

        console.log('✓ AI answer generated');

        res.json({
            query: query,
            answer: answer,
            results: topResults.map(r => ({
                content: r.content,
                source: r.metadata.originalName || r.metadata.source,
                page: r.metadata.loc?.pageNumber || 'N/A',
                similarity: (r.similarity * 100).toFixed(2),
                chunkIndex: r.chunkIndex
            })),
            totalDocuments: vectorStore.metadata.sourceFiles.length,
            model: 'Google Gemini 2.5 Flash'
        });

    } catch (error) {
        console.error('AI Query error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear vector store
app.delete('/api/clear', (req, res) => {
    try {
        const vectorStoreFile = './vector_store/embeddings.json';
        if (fs.existsSync(vectorStoreFile)) {
            fs.unlinkSync(vectorStoreFile);
        }

        // Also clear uploads
        const uploadDir = './uploads';
        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(uploadDir, file));
            });
        }

        res.json({ success: true, message: 'Vector store cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(70));
    console.log('🚀 RAG Document System Server Started!');
    console.log('='.repeat(70));
    console.log(`📡 Server running at: http://localhost:${PORT}`);
    console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/upload`);
    console.log(`🔍 Query endpoint: http://localhost:${PORT}/api/query`);
    console.log(`📊 Stats endpoint: http://localhost:${PORT}/api/stats`);
    console.log('='.repeat(70));
    console.log('Ready to accept documents and queries! 🎯\n');
});

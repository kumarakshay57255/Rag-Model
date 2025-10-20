import 'dotenv/config';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { OpenAIEmbeddings } from "@langchain/openai";
import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';

// Path to your files directory
const filesPath = "./files";

/* Custom DirectoryLoader implementation to load all PDFs */
async function loadPDFsFromDirectory(directoryPath) {
    const files = fs.readdirSync(directoryPath);
    const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');

    console.log(`Found ${pdfFiles.length} PDF file(s) in directory`);

    const allDocs = [];

    for (const file of pdfFiles) {
        const filePath = path.join(directoryPath, file);
        console.log(`Loading: ${filePath}`);

        const loader = new PDFLoader(filePath);
        const docs = await loader.load();
        allDocs.push(...docs);
    }

    return allDocs;
}

console.log('Loading documents from directory:', filesPath);
const directoryDocs = await loadPDFsFromDirectory(filesPath);

console.log('\n=== Directory Loader Results ===');
console.log('Total documents (pages) loaded:', directoryDocs.length);
console.log('\nFirst document:');
console.log(directoryDocs[0]);

/* Additional steps: Split text into chunks with any TextSplitter. 
   You can then use it as context or save it to memory afterwards. */
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    lengthFunction: (text) => text.length,
    separators: ['\n\n', '\n', ' ', '']
});

console.log('\n=== Splitting documents into chunks ===');
const splitDocs = await textSplitter.splitDocuments(directoryDocs);

console.log('Total chunks created:', splitDocs.length);
console.log('\nFirst chunk:');
console.log(splitDocs[0]);

// Display summary by file
console.log('\n=== Summary by File ===');
const fileGroups = directoryDocs.reduce((acc, doc) => {
    const source = doc.metadata.source;
    if (!acc[source]) {
        acc[source] = [];
    }
    acc[source].push(doc);
    return acc;
}, {});

Object.entries(fileGroups).forEach(([source, fileDocs]) => {
    console.log(`\nFile: ${source}`);
    console.log(`  - Pages: ${fileDocs.length}`);
    console.log(`  - Total characters: ${fileDocs.reduce((sum, d) => sum + d.pageContent.length, 0)}`);
});

/* Create Embeddings for the chunks */
console.log('\n=== Creating Embeddings ===');
console.log('Initializing local embedding model (no API key needed)...');
console.log('This will download the model on first run (~30MB)...');

// Using local Xenova/transformers embeddings (FREE - runs on your computer)
const embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

console.log(`Creating embeddings for ${splitDocs.length} chunks...`);
console.log('This may take a moment...\n');

// Create embeddings for all chunks
const documentEmbeddings = [];

for (let i = 0; i < splitDocs.length; i++) {
    const doc = splitDocs[i];
    console.log(`Processing chunk ${i + 1}/${splitDocs.length}...`);

    // Generate embedding for this chunk
    const output = await embeddingModel(doc.pageContent, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);

    documentEmbeddings.push({
        content: doc.pageContent,
        embedding: embedding,
        metadata: doc.metadata,
        chunkIndex: i
    });
}

console.log('\n✓ Embeddings created successfully!');
console.log(`✓ Created embeddings for ${documentEmbeddings.length} document chunks`);
if (documentEmbeddings.length > 0) {
    console.log(`✓ Each embedding has ${documentEmbeddings[0].embedding.length} dimensions`);
} else {
    console.log('⚠️  Warning: No documents found in the "files" directory!');
    console.log('   Please add some PDF files to the "files" folder and run again.');
    process.exit(0);
}

// Function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// Example: Search for similar documents
console.log('\n=== Testing Similarity Search ===');
const query = "Lorem ipsum";
console.log(`Query: "${query}"`);

// Create embedding for the query
console.log('Creating query embedding...');
const queryOutput = await embeddingModel(query, { pooling: 'mean', normalize: true });
const queryEmbedding = Array.from(queryOutput.data);

// Calculate similarity scores
const similarities = documentEmbeddings.map(doc => ({
    ...doc,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding)
}));

// Sort by similarity (highest first)
similarities.sort((a, b) => b.similarity - a.similarity);

// Get top 3 results
const topResults = similarities.slice(0, 3);

console.log(`\nTop 3 most similar chunks:`);
topResults.forEach((result, index) => {
    console.log(`\n--- Result ${index + 1} (Similarity: ${(result.similarity * 100).toFixed(2)}%) ---`);
    console.log('Source:', result.metadata.source);
    console.log('Page:', result.metadata.loc?.pageNumber || 'N/A');
    console.log('Chunk:', result.chunkIndex + 1);
    console.log('Content:', result.content.substring(0, 200) + '...');
});

console.log('\n=== Embeddings Summary ===');
console.log('✓ Successfully created embeddings for all document chunks');
console.log('✓ Embeddings are ready for similarity search');
console.log('✓ You can now use this for RAG (Retrieval Augmented Generation) applications');
console.log(`✓ Total storage: ${documentEmbeddings.length} chunks with ${documentEmbeddings[0].embedding.length}D vectors`);

/* Save embeddings to Vector Store (file-based) */
console.log('\n=== Saving to Vector Store ===');

const vectorStorePath = './vector_store';
const vectorStoreFile = path.join(vectorStorePath, 'embeddings.json');

// Create vector store directory if it doesn't exist
if (!fs.existsSync(vectorStorePath)) {
    fs.mkdirSync(vectorStorePath, { recursive: true });
    console.log(`✓ Created vector store directory: ${vectorStorePath}`);
}

// Prepare vector store data
const vectorStoreData = {
    embeddings: documentEmbeddings,
    metadata: {
        totalChunks: documentEmbeddings.length,
        dimensions: documentEmbeddings[0].embedding.length,
        model: 'Xenova/all-MiniLM-L6-v2',
        createdAt: new Date().toISOString(),
        sourceFiles: [...new Set(documentEmbeddings.map(doc => doc.metadata.source))]
    }
};

// Save to JSON file
fs.writeFileSync(vectorStoreFile, JSON.stringify(vectorStoreData, null, 2));
console.log(`✓ Saved ${documentEmbeddings.length} embeddings to: ${vectorStoreFile}`);
console.log(`✓ File size: ${(fs.statSync(vectorStoreFile).size / 1024 / 1024).toFixed(2)} MB`);

/* Create a simple vector store class for easy querying */
console.log('\n=== Vector Store Functions ===');

// Function to load embeddings from vector store
function loadVectorStore(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Vector store not found at: ${filePath}`);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log('✓ Loaded vector store:');
    console.log(`  - Total chunks: ${data.metadata.totalChunks}`);
    console.log(`  - Dimensions: ${data.metadata.dimensions}`);
    console.log(`  - Model: ${data.metadata.model}`);
    console.log(`  - Created: ${data.metadata.createdAt}`);
    console.log(`  - Source files: ${data.metadata.sourceFiles.length}`);
    return data;
}

// Function to search the vector store
async function searchVectorStore(query, vectorStoreData, topK = 3) {
    console.log(`\nSearching for: "${query}"`);

    // Generate embedding for query
    const queryOutput = await embeddingModel(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(queryOutput.data);

    // Calculate similarities
    const similarities = vectorStoreData.embeddings.map(doc => ({
        ...doc,
        similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    // Sort and get top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK);
}

// Example: Load and search the vector store
console.log('\n=== Testing Vector Store Loading ===');
const loadedVectorStore = loadVectorStore(vectorStoreFile);

// Test search on loaded vector store
const testQuery = "sample document";
console.log(`\n=== Testing Search on Loaded Vector Store ===`);
const searchResults = await searchVectorStore(testQuery, loadedVectorStore, 3);

console.log(`\nTop 3 results for "${testQuery}":`);
searchResults.forEach((result, index) => {
    console.log(`\n--- Result ${index + 1} (Similarity: ${(result.similarity * 100).toFixed(2)}%) ---`);
    console.log('Source:', result.metadata.source);
    console.log('Page:', result.metadata.loc?.pageNumber || 'N/A');
    console.log('Content:', result.content.substring(0, 150) + '...');
});

console.log('\n=== Final Summary ===');
console.log('✓ Embeddings created and stored successfully!');
console.log('✓ Vector store saved to disk for reuse');
console.log('✓ You can now load and search the vector store anytime');
console.log(`✓ Storage location: ${vectorStoreFile}`);
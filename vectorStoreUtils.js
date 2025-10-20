import 'dotenv/config';
import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';

// Vector Store Utilities
// This file provides easy-to-use functions for working with your saved embeddings

/**
 * Load embeddings from the vector store
 * @param {string} vectorStorePath - Path to the embeddings.json file
 * @returns {Object} Vector store data with embeddings and metadata
 */
export function loadVectorStore(vectorStorePath = './vector_store/embeddings.json') {
    if (!fs.existsSync(vectorStorePath)) {
        throw new Error(`Vector store not found at: ${vectorStorePath}`);
    }

    const data = JSON.parse(fs.readFileSync(vectorStorePath, 'utf-8'));
    console.log('✓ Loaded vector store:');
    console.log(`  - Total chunks: ${data.metadata.totalChunks}`);
    console.log(`  - Dimensions: ${data.metadata.dimensions}`);
    console.log(`  - Model: ${data.metadata.model}`);
    console.log(`  - Created: ${data.metadata.createdAt}`);
    console.log(`  - Source files: ${data.metadata.sourceFiles.length}`);

    return data;
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vecA - First vector
 * @param {Array} vecB - Second vector
 * @returns {number} Similarity score between 0 and 1
 */
export function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Search the vector store for similar documents
 * @param {string} query - Search query
 * @param {Object} vectorStoreData - Vector store data from loadVectorStore
 * @param {number} topK - Number of top results to return (default: 5)
 * @returns {Array} Top K most similar documents with similarity scores
 */
export async function searchVectorStore(query, vectorStoreData, topK = 5) {
    console.log(`\nSearching for: "${query}"`);

    // Initialize embedding model (cached after first call)
    const embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    // Generate embedding for query
    const queryOutput = await embeddingModel(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(queryOutput.data);

    // Calculate similarities
    const similarities = vectorStoreData.embeddings.map(doc => ({
        content: doc.content,
        metadata: doc.metadata,
        chunkIndex: doc.chunkIndex,
        similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    // Sort by similarity (highest first) and get top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK);
}

/**
 * Display search results in a formatted way
 * @param {Array} results - Search results from searchVectorStore
 */
export function displayResults(results, query = null) {
    if (query) {
        console.log(`\nTop ${results.length} results for "${query}":`);
    } else {
        console.log(`\nSearch Results (${results.length} total):`);
    }

    results.forEach((result, index) => {
        console.log(`\n--- Result ${index + 1} (Similarity: ${(result.similarity * 100).toFixed(2)}%) ---`);
        console.log('Source:', result.metadata.source);
        console.log('Page:', result.metadata.loc?.pageNumber || 'N/A');
        console.log('Chunk:', result.chunkIndex + 1);
        console.log('Content:', result.content.substring(0, 200) + '...');
    });
}

/**
 * Get statistics about the vector store
 * @param {Object} vectorStoreData - Vector store data from loadVectorStore
 * @returns {Object} Statistics about the vector store
 */
export function getVectorStoreStats(vectorStoreData) {
    const stats = {
        totalChunks: vectorStoreData.metadata.totalChunks,
        dimensions: vectorStoreData.metadata.dimensions,
        model: vectorStoreData.metadata.model,
        createdAt: vectorStoreData.metadata.createdAt,
        sourceFiles: vectorStoreData.metadata.sourceFiles,
        fileCount: vectorStoreData.metadata.sourceFiles.length,
        avgChunkLength: vectorStoreData.embeddings.reduce((sum, doc) =>
            sum + doc.content.length, 0) / vectorStoreData.embeddings.length
    };

    return stats;
}

// Example usage:
// import { loadVectorStore, searchVectorStore, displayResults } from './vectorStoreUtils.js';
// const vectorStore = loadVectorStore();
// const results = await searchVectorStore("your query", vectorStore, 3);
// displayResults(results, "your query");

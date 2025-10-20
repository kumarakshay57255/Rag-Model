import 'dotenv/config';
import { loadVectorStore, searchVectorStore, displayResults, getVectorStoreStats } from './vectorStoreUtils.js';

// Example: How to use the saved vector store
console.log('=== Vector Store Usage Example ===\n');

// 1. Load the vector store
console.log('Step 1: Loading vector store...');
const vectorStore = loadVectorStore('./vector_store/embeddings.json');

// 2. Get statistics
console.log('\n=== Vector Store Statistics ===');
const stats = getVectorStoreStats(vectorStore);
console.log('Total Chunks:', stats.totalChunks);
console.log('Embedding Dimensions:', stats.dimensions);
console.log('Model:', stats.model);
console.log('Number of Files:', stats.fileCount);
console.log('Average Chunk Length:', Math.round(stats.avgChunkLength), 'characters');
console.log('Source Files:');
stats.sourceFiles.forEach((file, i) => console.log(`  ${i + 1}. ${file}`));

// 3. Perform searches
console.log('\n=== Example Searches ===');

// Search 1
let query1 = "Lorem ipsum";
console.log(`\n--- Search 1: "${query1}" ---`);
let results1 = await searchVectorStore(query1, vectorStore, 3);
displayResults(results1, query1);

// Search 2
let query2 = "sample document";
console.log(`\n--- Search 2: "${query2}" ---`);
let results2 = await searchVectorStore(query2, vectorStore, 3);
displayResults(results2, query2);

// Search 3 - Try your own query!
let query3 = "text content";
console.log(`\n--- Search 3: "${query3}" ---`);
let results3 = await searchVectorStore(query3, vectorStore, 3);
displayResults(results3, query3);

console.log('\n=== Usage Complete ===');
console.log('✓ You can modify the queries above to search for different topics');
console.log('✓ The vector store is persistent and can be reused without recreating embeddings');
console.log('✓ Add more PDFs to the files folder and run index.js again to update the vector store');

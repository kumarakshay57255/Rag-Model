// Test query script
import 'dotenv/config';
import { pipeline } from '@xenova/transformers';
import { searchSimilar } from './milvusUtils.js';

async function testQuery() {
    try {
        const question = "What is Lark Finserv?";
        console.log(`\n🔍 Testing query: "${question}"\n`);
        
        // Initialize embedding model
        console.log('Loading embedding model...');
        const generateEmbedding = await pipeline(
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2'
        );
        
        // Generate query embedding
        console.log('Generating query embedding...');
        const output = await generateEmbedding(question, {
            pooling: 'mean',
            normalize: true,
        });
        const queryEmbedding = Array.from(output.data);
        
        // Search Milvus
        console.log('Searching Milvus...\n');
        const results = await searchSimilar(queryEmbedding, 3);
        
        if (results.length === 0) {
            console.log('❌ No results found!');
        } else {
            console.log(`✅ Found ${results.length} results:\n`);
            results.forEach((result, i) => {
                console.log(`Result ${i + 1}:`);
                console.log(`  Source: ${result.source}`);
                console.log(`  Similarity: ${(result.similarity * 100).toFixed(2)}%`);
                console.log(`  Content: ${result.content.substring(0, 200)}...`);
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
    
    process.exit(0);
}

testQuery();

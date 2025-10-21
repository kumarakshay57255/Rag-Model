// Test script to check Milvus database status
import 'dotenv/config';
import { getStats } from './milvusUtils.js';

async function testMilvus() {
    try {
        console.log('Testing Milvus connection and data...\n');
        
        const stats = await getStats();
        
        console.log('📊 Database Statistics:');
        console.log('======================');
        console.log(`Total Documents: ${stats.totalDocuments}`);
        console.log(`Total Chunks: ${stats.totalChunks}`);
        console.log(`Vector Dimensions: ${stats.dimensions}`);
        console.log(`Embedding Model: ${stats.model}`);
        
        if (stats.sourceFiles && stats.sourceFiles.length > 0) {
            console.log('\n📁 Source Files:');
            stats.sourceFiles.forEach((file, index) => {
                console.log(`  ${index + 1}. ${file.name} (${file.type})`);
            });
        } else {
            console.log('\n⚠️  No documents found in database');
        }
        
        console.log('\n✅ Test complete!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
}

testMilvus();

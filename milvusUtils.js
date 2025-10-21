import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';

// Milvus configuration
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'localhost:19530';
const COLLECTION_NAME = 'rag_documents';
const VECTOR_DIM = 384; // Xenova/all-MiniLM-L6-v2 dimension

let milvusClient = null;

/**
 * Initialize Milvus client
 */
export async function initMilvusClient() {
    if (!milvusClient) {
        console.log(`Connecting to Milvus at ${MILVUS_ADDRESS}...`);
        
        // For Zilliz Cloud, use token authentication (username:password format)
        const token = `${process.env.MILVUS_USER}:${process.env.MILVUS_PASSWORD}`;
        
        milvusClient = new MilvusClient({
            address: MILVUS_ADDRESS,
            token: token,
            ssl: true, // Enable SSL for cloud connections
            timeout: 60000, // 60 second default timeout for cloud operations
        });
        console.log('✓ Connected to Milvus Cloud');
    }
    return milvusClient;
}

/**
 * Create collection if it doesn't exist
 */
export async function createCollection() {
    const client = await initMilvusClient();

    // Check if collection exists
    const hasCollection = await client.hasCollection({
        collection_name: COLLECTION_NAME,
    });

    if (hasCollection.value) {
        console.log(`Collection "${COLLECTION_NAME}" already exists`);
        return;
    }

    console.log(`Creating collection "${COLLECTION_NAME}"...`);

    // Define schema
    const schema = [
        {
            name: 'id',
            description: 'Document chunk ID',
            data_type: DataType.Int64,
            is_primary_key: true,
            autoID: true,
        },
        {
            name: 'content',
            description: 'Document content text',
            data_type: DataType.VarChar,
            max_length: 65535,
        },
        {
            name: 'embedding',
            description: 'Vector embedding',
            data_type: DataType.FloatVector,
            dim: VECTOR_DIM,
        },
        {
            name: 'source',
            description: 'Source file/URL name',
            data_type: DataType.VarChar,
            max_length: 512,
        },
        {
            name: 'source_type',
            description: 'Type of source (file/url)',
            data_type: DataType.VarChar,
            max_length: 50,
        },
        {
            name: 'chunk_index',
            description: 'Chunk index in document',
            data_type: DataType.Int64,
        },
        {
            name: 'uploaded_at',
            description: 'Upload timestamp',
            data_type: DataType.VarChar,
            max_length: 50,
        },
    ];

    // Create collection
    await client.createCollection({
        collection_name: COLLECTION_NAME,
        fields: schema,
        enableDynamicField: true,
    });

    console.log('✓ Collection created');

    // Create index for vector field
    await client.createIndex({
        collection_name: COLLECTION_NAME,
        field_name: 'embedding',
        index_type: 'IVF_FLAT',
        metric_type: 'L2',
        params: { nlist: 1024 },
    });

    console.log('✓ Index created');

    // Load collection
    await client.loadCollection({
        collection_name: COLLECTION_NAME,
    });

    console.log('✓ Collection loaded');
}

/**
 * Insert embeddings into Milvus
 */
export async function insertEmbeddings(embeddings) {
    const client = await initMilvusClient();

    // Ensure collection exists and is loaded
    await createCollection();

    // Prepare data for insertion
    const data = embeddings.map(item => ({
        content: item.content,
        embedding: item.embedding,
        source: item.metadata.originalName || item.metadata.source || 'unknown',
        source_type: item.metadata.fileType || item.metadata.sourceType || 'file',
        chunk_index: item.chunkIndex || 0,
        uploaded_at: item.metadata.uploadedAt || new Date().toISOString(),
    }));

    console.log(`Inserting ${data.length} embeddings into Milvus...`);

    // For serverless/cloud, split large batches to avoid timeout
    const BATCH_SIZE = 100;
    let totalInserted = 0;

    if (data.length <= BATCH_SIZE) {
        // Small batch - insert all at once
        const result = await client.insert({
            collection_name: COLLECTION_NAME,
            data: data,
            timeout: 60000, // 60 second timeout
        });
        totalInserted = result.insert_cnt;
    } else {
        // Large batch - split into smaller chunks
        console.log(`⚡ Splitting into batches of ${BATCH_SIZE}...`);
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);
            console.log(`  Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(data.length / BATCH_SIZE)} (${batch.length} items)...`);
            
            const result = await client.insert({
                collection_name: COLLECTION_NAME,
                data: batch,
                timeout: 60000, // 60 second timeout per batch
            });
            totalInserted += result.insert_cnt;
            
            // Small delay between batches for serverless tier
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    console.log(`✓ Inserted ${totalInserted} embeddings`);

    return { insert_cnt: totalInserted };
}

/**
 * Search for similar vectors
 */
export async function searchSimilar(queryEmbedding, topK = 3) {
    const client = await initMilvusClient();

    // Ensure collection is loaded
    const loadState = await client.getLoadState({
        collection_name: COLLECTION_NAME,
    });

    if (loadState.state !== 'LoadStateLoaded') {
        await client.loadCollection({
            collection_name: COLLECTION_NAME,
        });
    }

    console.log(`Searching for top ${topK} similar documents...`);

    const searchResult = await client.search({
        collection_name: COLLECTION_NAME,
        vector: queryEmbedding,
        limit: topK,
        output_fields: ['content', 'source', 'source_type', 'chunk_index'],
        metric_type: 'L2',
        timeout: 30000, // 30 second timeout for searches
    });

    // Check if we have results
    if (!searchResult.results || searchResult.results.length === 0) {
        console.log('⚠️  No similar documents found');
        return [];
    }

    // Transform results
    const results = searchResult.results.map(result => ({
        content: result.content,
        source: result.source,
        sourceType: result.source_type,
        chunkIndex: result.chunk_index,
        distance: result.score, // L2 distance
        similarity: 1 / (1 + result.score), // Convert distance to similarity score
    }));

    console.log(`✓ Found ${results.length} similar documents`);

    return results;
}

/**
 * Get collection statistics
 */
export async function getStats() {
    const client = await initMilvusClient();

    try {
        const hasCollection = await client.hasCollection({
            collection_name: COLLECTION_NAME,
        });

        if (!hasCollection.value) {
            return {
                totalDocuments: 0,
                totalChunks: 0,
                dimensions: VECTOR_DIM,
            };
        }

        const stats = await client.getCollectionStatistics({
            collection_name: COLLECTION_NAME,
        });

        // Get unique sources
        const queryResult = await client.query({
            collection_name: COLLECTION_NAME,
            expr: 'id > 0',
            output_fields: ['source', 'source_type'],
            limit: 16384, // Max limit
        });

        const uniqueSources = new Map();
        queryResult.data.forEach(item => {
            const key = `${item.source}`;
            if (!uniqueSources.has(key)) {
                uniqueSources.set(key, {
                    name: item.source,
                    type: item.source_type,
                });
            }
        });

        // Extract row count from stats (format varies by Milvus version)
        let rowCount = 0;
        if (stats.data) {
            rowCount = parseInt(stats.data.row_count) || parseInt(stats.data.rowCount) || queryResult.data.length;
        }

        return {
            totalDocuments: uniqueSources.size,
            totalChunks: rowCount || queryResult.data.length,
            dimensions: VECTOR_DIM,
            model: 'Xenova/all-MiniLM-L6-v2',
            sourceFiles: Array.from(uniqueSources.values()),
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return {
            totalDocuments: 0,
            totalChunks: 0,
            dimensions: VECTOR_DIM,
        };
    }
}

/**
 * Clear all data from collection
 */
export async function clearCollection() {
    const client = await initMilvusClient();

    const hasCollection = await client.hasCollection({
        collection_name: COLLECTION_NAME,
    });

    if (hasCollection.value) {
        console.log('Dropping collection...');
        await client.dropCollection({
            collection_name: COLLECTION_NAME,
        });
        console.log('✓ Collection dropped');
    }

    // Recreate empty collection
    await createCollection();
    console.log('✓ Collection recreated');
}

/**
 * Close Milvus connection
 */
export async function closeMilvusClient() {
    if (milvusClient) {
        console.log('Closing Milvus connection...');
        // Milvus SDK v2 doesn't require explicit close
        milvusClient = null;
        console.log('✓ Connection closed');
    }
}

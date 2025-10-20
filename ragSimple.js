import 'dotenv/config';
import { loadVectorStore, searchVectorStore } from './vectorStoreUtils.js';
import readline from 'readline';

// Initialize the RAG System (Without OpenAI - Template-based)
console.log('=== RAG (Retrieval Augmented Generation) System ===');
console.log('=== Using Template-based Answers (No API Key Required) ===\n');

// Load the vector store
console.log('Loading vector store...');
const vectorStore = loadVectorStore('./vector_store/embeddings.json');
console.log('✓ Vector store loaded and ready!\n');

/**
 * RAG Pipeline: Retrieve relevant documents and format answer
 * @param {string} query - User's question
 * @param {number} topK - Number of documents to retrieve
 * @returns {Object} - Answer and retrieved documents
 */
async function ragQuery(query, topK = 3) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📝 Query: "${query}"`);
    console.log('='.repeat(70));

    // Step 1: Convert query to embeddings and retrieve relevant documents
    console.log('\n🔍 Step 1: Converting query to embeddings...');
    console.log('🔍 Step 2: Retrieving relevant documents from vector store...');

    const retrievedDocs = await searchVectorStore(query, vectorStore, topK);

    console.log(`✓ Retrieved ${retrievedDocs.length} relevant chunks:`);
    retrievedDocs.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.metadata.source} (Page ${doc.metadata.loc?.pageNumber || 'N/A'}) - Similarity: ${(doc.similarity * 100).toFixed(2)}%`);
    });

    // Step 2: Format answer with retrieved context
    console.log('\n📋 Step 3: Formatting answer with retrieved context...');

    const answer = generateTemplateAnswer(query, retrievedDocs);

    console.log('✅ Answer prepared successfully!');

    return {
        query: query,
        answer: answer,
        retrievedDocs: retrievedDocs,
        sourcesUsed: retrievedDocs.length
    };
}

/**
 * Generate a template-based answer from retrieved documents
 * @param {string} query - User query
 * @param {Array} docs - Retrieved documents
 * @returns {string} - Formatted answer
 */
function generateTemplateAnswer(query, docs) {
    if (docs.length === 0) {
        return "I couldn't find any relevant information in the documents to answer your question.";
    }

    let answer = `Based on the documents, here's what I found:\n\n`;

    docs.forEach((doc, index) => {
        const source = doc.metadata.source.split('\\').pop();
        const page = doc.metadata.loc?.pageNumber || 'N/A';
        const relevance = (doc.similarity * 100).toFixed(1);

        answer += `📄 Source ${index + 1}: ${source} (Page ${page}) - Relevance: ${relevance}%\n`;
        answer += `${doc.content.substring(0, 300)}${doc.content.length > 300 ? '...' : ''}\n\n`;
    });

    answer += `\n💡 This information was retrieved from ${docs.length} document chunk(s) with semantic similarity matching.`;

    return answer;
}

/**
 * Display the RAG result in a formatted way
 * @param {Object} result - Result from ragQuery
 */
function displayRAGResult(result) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 RAG RESULT');
    console.log('='.repeat(70));

    console.log(`\n❓ Question:`);
    console.log(`   ${result.query}`);

    console.log(`\n💡 Answer:\n`);
    console.log(result.answer);

    console.log(`\n📚 Retrieved Sources: ${result.sourcesUsed} documents`);
    result.retrievedDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.metadata.source} (Page ${doc.metadata.loc?.pageNumber || 'N/A'})`);
        console.log(`      Relevance: ${(doc.similarity * 100).toFixed(2)}%`);
        console.log(`      Preview: ${doc.content.substring(0, 100)}...`);
    });

    console.log(`\n${'='.repeat(70)}\n`);
}

/**
 * Interactive RAG Chat - Ask questions interactively
 */
async function interactiveRAGChat() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\n' + '='.repeat(70));
    console.log('🚀 Interactive RAG Chat Started!');
    console.log('='.repeat(70));
    console.log('📝 Type your questions to search the documents');
    console.log('🔍 The system will find relevant content using semantic search');
    console.log('💡 Commands: "exit" to quit, "help" for help, "stats" for statistics');
    console.log('='.repeat(70) + '\n');

    const askQuestion = () => {
        rl.question('You: ', async (input) => {
            const query = input.trim();

            if (!query) {
                askQuestion();
                return;
            }

            if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
                console.log('\n👋 Goodbye! Thanks for using RAG Chat.\n');
                rl.close();
                return;
            }

            if (query.toLowerCase() === 'help') {
                console.log('\n📖 Help:');
                console.log('  - Ask any question about your documents');
                console.log('  - The system converts your query to embeddings');
                console.log('  - Finds most relevant document chunks using cosine similarity');
                console.log('  - Displays the matching content with relevance scores');
                console.log('  - Type "stats" to see vector store statistics');
                console.log('  - Type "exit" or "quit" to end the chat\n');
                askQuestion();
                return;
            }

            if (query.toLowerCase() === 'stats') {
                console.log('\n📊 Vector Store Statistics:');
                console.log(`  - Total Chunks: ${vectorStore.metadata.totalChunks}`);
                console.log(`  - Embedding Dimensions: ${vectorStore.metadata.dimensions}`);
                console.log(`  - Model: ${vectorStore.metadata.model}`);
                console.log(`  - Source Files: ${vectorStore.metadata.sourceFiles.length}`);
                vectorStore.metadata.sourceFiles.forEach((file, i) => {
                    console.log(`    ${i + 1}. ${file}`);
                });
                console.log('');
                askQuestion();
                return;
            }

            try {
                const result = await ragQuery(query, 3);
                displayRAGResult(result);
            } catch (error) {
                console.error('\n❌ Error:', error.message);
                console.log('Please try again.\n');
            }

            askQuestion();
        });
    };

    askQuestion();
}

// Example usage - Run predefined queries or start interactive mode
async function main() {
    const mode = process.argv[2] || 'example';

    if (mode === 'interactive' || mode === '-i') {
        // Start interactive chat
        await interactiveRAGChat();
    } else {
        // Run example queries
        console.log('🎯 Running Example RAG Queries...\n');

        // Example 1
        console.log('━'.repeat(70));
        console.log('Example 1: Searching for "Lorem ipsum"');
        console.log('━'.repeat(70));
        const result1 = await ragQuery("What is Lorem ipsum?", 3);
        displayRAGResult(result1);

        // Example 2
        console.log('━'.repeat(70));
        console.log('Example 2: Searching for "PDF document sample"');
        console.log('━'.repeat(70));
        const result2 = await ragQuery("Tell me about the PDF document sample", 3);
        displayRAGResult(result2);

        // Example 3
        console.log('━'.repeat(70));
        console.log('Example 3: Searching for specific content');
        console.log('━'.repeat(70));
        const result3 = await ragQuery("What content is about testing?", 3);
        displayRAGResult(result3);

        console.log('✅ Example queries complete!');
        console.log('\n💡 Tips:');
        console.log('  • Run "node ragSimple.js interactive" for interactive chat mode');
        console.log('  • Try different queries to see semantic search in action');
        console.log('  • The system finds relevant content even with different wording\n');
    }
}

// Run the system
main().catch(console.error);

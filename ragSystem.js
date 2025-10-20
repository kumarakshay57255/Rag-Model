import 'dotenv/config';
import { loadVectorStore, searchVectorStore } from './vectorStoreUtils.js';
import { ChatOpenAI } from "@langchain/openai";
import readline from 'readline';

// Initialize the RAG System
console.log('=== RAG (Retrieval Augmented Generation) System ===\n');

// Load the vector store
console.log('Loading vector store...');
const vectorStore = loadVectorStore('./vector_store/embeddings.json');

// Initialize the LLM (OpenAI Chat Model)
console.log('\nInitializing language model...');

// Check if OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OpenAI API key not found!');
    console.log('Please set your OPENAI_API_KEY in the .env file');
    console.log('Get your API key from: https://platform.openai.com/api-keys');
    process.exit(1);
}

const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo", // You can change to "gpt-4" for better results
    temperature: 0.7, // Controls randomness (0 = deterministic, 1 = creative)
});

console.log('✓ Language model initialized');

/**
 * RAG Pipeline: Retrieve relevant documents and generate answer
 * @param {string} query - User's question
 * @param {number} topK - Number of documents to retrieve
 * @returns {Object} - Answer and retrieved documents
 */
async function ragQuery(query, topK = 3) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📝 Query: "${query}"`);
    console.log('='.repeat(70));

    // Step 1: Retrieve relevant documents from vector store
    console.log('\n🔍 Step 1: Retrieving relevant documents...');
    const retrievedDocs = await searchVectorStore(query, vectorStore, topK);

    console.log(`✓ Retrieved ${retrievedDocs.length} relevant chunks:`);
    retrievedDocs.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.metadata.source} (Page ${doc.metadata.loc?.pageNumber || 'N/A'}) - Similarity: ${(doc.similarity * 100).toFixed(2)}%`);
    });

    // Step 2: Prepare context from retrieved documents
    const context = retrievedDocs
        .map((doc, index) => `[Document ${index + 1}] ${doc.content}`)
        .join('\n\n');

    // Step 3: Create prompt with context
    console.log('\n🤖 Step 2: Generating answer with LLM...');
    const prompt = `You are a helpful assistant. Use the following context from documents to answer the user's question. If the answer cannot be found in the context, say so.

Context from documents:
${context}

Question: ${query}

Answer:`;

    // Step 4: Generate answer using LLM
    const response = await llm.invoke(prompt);
    const answer = response.content;

    console.log('\n✅ Answer generated successfully!');

    return {
        query: query,
        answer: answer,
        retrievedDocs: retrievedDocs,
        sourcesUsed: retrievedDocs.length
    };
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

    console.log(`\n💡 Answer:`);
    console.log(`   ${result.answer}`);

    console.log(`\n📚 Sources Used: ${result.sourcesUsed} documents`);
    result.retrievedDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.metadata.source} (Page ${doc.metadata.loc?.pageNumber || 'N/A'})`);
        console.log(`      Relevance: ${(doc.similarity * 100).toFixed(2)}%`);
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
    console.log('Type your questions and get answers based on your documents.');
    console.log('Commands: "exit" to quit, "help" for help');
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
                console.log('  - Type "exit" or "quit" to end the chat');
                console.log('  - The system will find relevant content and generate answers\n');
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
        console.log('\n🎯 Running Example RAG Queries...\n');

        // Example 1
        const query1 = "What is Lorem ipsum?";
        console.log('Example 1: General question');
        const result1 = await ragQuery(query1, 3);
        displayRAGResult(result1);

        // Example 2
        const query2 = "Tell me about the PDF documents";
        console.log('Example 2: Document overview');
        const result2 = await ragQuery(query2, 3);
        displayRAGResult(result2);

        // Example 3
        const query3 = "What content is in the sample files?";
        console.log('Example 3: Content query');
        const result3 = await ragQuery(query3, 3);
        displayRAGResult(result3);

        console.log('\n✅ Example queries complete!');
        console.log('\n💡 Tip: Run "node ragSystem.js interactive" for interactive chat mode\n');
    }
}

// Run the system
main().catch(console.error);

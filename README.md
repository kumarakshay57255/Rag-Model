# LangChain PDF Embeddings & Vector Store

A complete LangChain implementation for loading PDFs, creating embeddings, and storing them in a vector store for semantic search.

## 📁 Project Structure

```
Langchain/
├── files/                          # Place your PDF files here
│   ├── file-sample_150kB.pdf
│   └── sample-local-pdf.pdf
├── vector_store/                   # Auto-generated vector store
│   └── embeddings.json            # Saved embeddings (0.28 MB)
├── index.js                        # Main: Create embeddings from PDFs
├── searchExample.js               # Example: Search the vector store
├── vectorStoreUtils.js            # Utility functions for vector store
├── .env                           # Environment variables
└── package.json                   # Dependencies
```

## 🚀 Features

✅ **Directory Loader** - Automatically loads all PDFs from the `files` folder
✅ **Document Chunking** - Splits documents into manageable chunks (1000 chars, 200 overlap)
✅ **Local Embeddings** - Uses Xenova/all-MiniLM-L6-v2 (FREE, no API key needed)
✅ **Vector Store** - Saves embeddings to disk for reuse
✅ **Semantic Search** - Find similar documents using cosine similarity
✅ **RAG Ready** - Perfect for building question-answering systems

## 📊 Current Stats

- **Total Documents**: 2 PDF files (6 pages)
- **Total Chunks**: 22 document chunks
- **Embedding Dimensions**: 384D vectors
- **Model**: Xenova/all-MiniLM-L6-v2
- **Storage Size**: 0.28 MB

## 🎯 Usage

### 1. Create Embeddings from PDFs

Run this when you have new PDFs or want to recreate the vector store:

```bash
node index.js
```

This will:

- Load all PDFs from `./files` directory
- Split documents into chunks
- Create embeddings for each chunk
- Save to `./vector_store/embeddings.json`

### 2. Search the Vector Store

Use the saved embeddings without recreating them:

```bash
node searchExample.js
```

This demonstrates:

- Loading the vector store
- Viewing statistics
- Performing semantic searches
- Displaying top results

### 3. Use in Your Own Code

```javascript
import {
  loadVectorStore,
  searchVectorStore,
  displayResults,
} from "./vectorStoreUtils.js";

// Load the vector store
const vectorStore = loadVectorStore("./vector_store/embeddings.json");

// Search for similar documents
const results = await searchVectorStore("your query here", vectorStore, 5);

// Display results
displayResults(results, "your query here");
```

## 🛠️ Available Functions

### `loadVectorStore(path)`

Load embeddings from disk

- **Returns**: Vector store data with embeddings and metadata

### `searchVectorStore(query, vectorStore, topK)`

Search for similar documents

- **query**: Search string
- **vectorStore**: Loaded vector store data
- **topK**: Number of results to return (default: 5)
- **Returns**: Array of top K most similar documents

### `displayResults(results, query)`

Pretty print search results

- **results**: Search results from searchVectorStore
- **query**: Original query string (optional)

### `getVectorStoreStats(vectorStore)`

Get statistics about the vector store

- **Returns**: Object with stats (totalChunks, dimensions, model, etc.)

### `cosineSimilarity(vecA, vecB)`

Calculate similarity between two vectors

- **Returns**: Similarity score between 0 and 1

## 📦 Dependencies

```json
{
  "@langchain/community": "^1.0.0",
  "@langchain/core": "^1.0.1",
  "@langchain/openai": "latest",
  "@langchain/textsplitters": "latest",
  "@xenova/transformers": "latest",
  "dotenv": "latest",
  "langchain": "^1.0.1",
  "pdf-parse": "^1.1.1"
}
```

## 🔧 Configuration

### Environment Variables (.env)

```
OPENAI_API_KEY=your-api-key-here  # Optional, not needed for local embeddings
```

### Chunking Configuration (index.js)

```javascript
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // Characters per chunk
  chunkOverlap: 200, // Overlap between chunks
});
```

## 💡 Use Cases

1. **Document Search** - Find relevant sections in large PDFs
2. **Question Answering** - Build RAG systems with LLMs
3. **Semantic Search** - Search by meaning, not just keywords
4. **Content Recommendation** - Find similar documents
5. **Knowledge Base** - Create searchable document repositories

## 🎓 Example Searches

```javascript
// Search for specific topics
await searchVectorStore("Lorem ipsum", vectorStore, 3);

// Find sample documents
await searchVectorStore("sample document", vectorStore, 3);

// Search for general content
await searchVectorStore("text content", vectorStore, 5);
```

## 🔄 Updating the Vector Store

When you add new PDFs:

1. Place new PDFs in the `./files` folder
2. Run `node index.js` to recreate embeddings
3. The vector store will be updated automatically

## 📝 Notes

- **First run** downloads the embedding model (~30MB)
- **Embeddings are cached** - subsequent runs are faster
- **No API costs** - everything runs locally
- **Vector store is persistent** - saved to disk for reuse
- **Scalable** - can handle hundreds of documents

## 🚀 Next Steps

- Add more PDFs to the `files` folder
- Integrate with an LLM (OpenAI, Claude, Gemini) for Q&A
- Deploy to a vector database (Pinecone, Chroma, FAISS)
- Build a web interface for searching
- Add filtering by metadata (source file, page number, etc.)

## 📄 License

ISC

---

**Created with LangChain** 🦜🔗

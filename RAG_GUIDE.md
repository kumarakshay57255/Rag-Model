# 🚀 RAG System Usage Guide

## Complete RAG (Retrieval Augmented Generation) Implementation

Your system now has **full RAG capabilities**! Here's everything you need to know:

---

## 📁 Files Overview

| File                  | Purpose                       | API Key Required |
| --------------------- | ----------------------------- | ---------------- |
| `index.js`            | Create embeddings from PDFs   | ❌ No            |
| `searchExample.js`    | Basic vector search examples  | ❌ No            |
| `ragSimple.js`        | RAG with template answers     | ❌ No            |
| `ragSystem.js`        | RAG with AI-generated answers | ✅ Yes (OpenAI)  |
| `vectorStoreUtils.js` | Utility functions             | ❌ No            |

---

## 🎯 How RAG Works

### Step-by-Step Process:

```
1. User Query → "What is Lorem ipsum?"
        ↓
2. Convert Query to Embeddings (384D vector)
        ↓
3. Search Vector Store using Cosine Similarity
        ↓
4. Retrieve Top K Most Similar Documents
        ↓
5. Format/Generate Answer with Context
        ↓
6. Return Answer + Sources
```

---

## 🚀 Quick Start

### Option 1: Simple RAG (No API Key)

**Run Example Queries:**

```bash
node ragSimple.js
```

**Interactive Chat:**

```bash
node ragSimple.js interactive
```

Then type your questions:

```
You: What is in the documents?
You: Tell me about Lorem ipsum
You: help          # Show help
You: stats         # Show statistics
You: exit          # Quit
```

---

### Option 2: AI-Powered RAG (Requires OpenAI API Key)

**Prerequisites:**

1. Add credits to your OpenAI account
2. Ensure `.env` has your API key:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

**Run Example Queries:**

```bash
node ragSystem.js
```

**Interactive Chat with AI:**

```bash
node ragSystem.js interactive
```

---

## 💡 Example Queries to Try

### General Questions:

- "What is this document about?"
- "Tell me about Lorem ipsum"
- "What content is in the PDF?"

### Specific Searches:

- "Find information about testing"
- "What does the sample document contain?"
- "Show me text about pages"

### Exploratory:

- "What are the main topics?"
- "Summarize the content"
- "What information is available?"

---

## 📊 Understanding the Output

### RAG Query Response:

```javascript
{
  query: "Your question",
  answer: "Generated/formatted answer with context",
  retrievedDocs: [
    {
      content: "Document text...",
      embedding: [384D vector],
      metadata: { source, page, etc },
      similarity: 0.8534  // Relevance score (0-1)
    },
    // ... more docs
  ],
  sourcesUsed: 3
}
```

### Similarity Scores:

- **40%+** = Highly relevant ⭐⭐⭐
- **25-40%** = Relevant ⭐⭐
- **15-25%** = Somewhat relevant ⭐
- **<15%** = Low relevance

---

## 🛠️ Customization

### Change Number of Retrieved Documents:

```javascript
// Get top 5 instead of 3
await ragQuery("your question", 5);
```

### Adjust Text Chunking:

Edit `index.js`:

```javascript
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // Increase for larger chunks
  chunkOverlap: 200, // Increase for more context overlap
});
```

### Change AI Model (ragSystem.js):

```javascript
const llm = new ChatOpenAI({
  modelName: "gpt-4", // Use GPT-4 for better answers
  temperature: 0.3, // Lower = more focused, Higher = more creative
});
```

---

## 🔧 Programmatic Usage

### Basic RAG Query:

```javascript
import { loadVectorStore, searchVectorStore } from "./vectorStoreUtils.js";

// Load vector store
const vectorStore = loadVectorStore();

// Query and retrieve
const query = "What is Lorem ipsum?";
const results = await searchVectorStore(query, vectorStore, 3);

// Process results
results.forEach((doc) => {
  console.log(`Source: ${doc.metadata.source}`);
  console.log(`Relevance: ${(doc.similarity * 100).toFixed(2)}%`);
  console.log(`Content: ${doc.content}\n`);
});
```

### Build Your Own RAG Function:

```javascript
import { pipeline } from "@xenova/transformers";
import { loadVectorStore, cosineSimilarity } from "./vectorStoreUtils.js";

async function myRAG(question, numResults = 3) {
  // 1. Load vector store
  const vectorStore = loadVectorStore();

  // 2. Create query embedding
  const model = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const queryOutput = await model(question, {
    pooling: "mean",
    normalize: true,
  });
  const queryEmbedding = Array.from(queryOutput.data);

  // 3. Calculate similarities
  const results = vectorStore.embeddings.map((doc) => ({
    content: doc.content,
    metadata: doc.metadata,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  // 4. Sort and return top results
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, numResults);
}

// Use it
const answer = await myRAG("your question", 5);
```

---

## 📈 Performance Tips

### Optimize Vector Store:

- **Keep chunks focused**: 500-1500 characters per chunk
- **Use overlap**: 10-20% overlap between chunks
- **Index by metadata**: Filter by source, date, category

### Speed Up Searches:

- **Reduce topK**: Only retrieve what you need (3-5 docs)
- **Cache embeddings**: Reuse vector store across queries
- **Batch queries**: Process multiple questions together

### Improve Relevance:

- **Quality PDFs**: Clear, well-formatted documents
- **Good chunking**: Break at logical boundaries
- **Metadata filtering**: Add tags/categories to chunks

---

## 🎓 Use Cases

### 1. Document Q&A System

```bash
node ragSimple.js interactive
# Ask questions about your documents
```

### 2. Semantic Search Engine

```javascript
const results = await searchVectorStore("user query", vectorStore, 10);
// Display as search results with snippets
```

### 3. Content Recommendation

```javascript
// Find similar documents
const similar = await searchVectorStore("document content", vectorStore, 5);
// Recommend related content
```

### 4. Knowledge Base

```javascript
// Build a FAQ bot
const answer = await ragQuery(userQuestion, 3);
// Return context-aware answers
```

### 5. Research Assistant

```javascript
// Search across multiple documents
// Aggregate findings
// Generate summaries
```

---

## 🔍 Debugging

### Check Vector Store:

```bash
node -e "import('./vectorStoreUtils.js').then(m => console.log(m.loadVectorStore()))"
```

### Test Embedding Model:

```javascript
import { pipeline } from "@xenova/transformers";
const model = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
const output = await model("test query", { pooling: "mean", normalize: true });
console.log("Embedding dimensions:", output.data.length); // Should be 384
```

### Verify Similarity Calculation:

```javascript
import { cosineSimilarity } from "./vectorStoreUtils.js";
const vec1 = [1, 0, 0];
const vec2 = [1, 0, 0];
console.log(cosineSimilarity(vec1, vec2)); // Should be 1.0 (identical)
```

---

## 🆘 Troubleshooting

### Issue: "Vector store not found"

**Solution:** Run `node index.js` first to create embeddings

### Issue: "OpenAI quota exceeded"

**Solution:** Use `ragSimple.js` instead (no API needed) or add credits

### Issue: "Low similarity scores"

**Solution:**

- Rephrase your query
- Add more relevant documents
- Check if content exists in PDFs

### Issue: "Slow performance"

**Solution:**

- Model downloads on first run (~30MB)
- Subsequent runs are much faster
- Consider caching the embedding model

---

## 📝 Next Steps

1. ✅ **Add more documents** to `./files` folder
2. ✅ **Run `node index.js`** to update embeddings
3. ✅ **Try different queries** to see semantic search in action
4. ✅ **Build your own application** using the utilities
5. ✅ **Integrate with a web frontend** for user-friendly interface
6. ✅ **Deploy to production** with a proper vector database

---

## 🎯 Production Deployment

### Recommended Vector Databases:

- **Pinecone** - Managed, fast, scalable
- **Chroma** - Open source, Python/JS
- **FAISS** - Facebook's similarity search
- **Weaviate** - GraphQL-based
- **Qdrant** - Rust-based, fast

### Migration Path:

1. Export embeddings from `embeddings.json`
2. Upload to vector database
3. Update search queries to use DB API
4. Add authentication and rate limiting
5. Deploy with your application

---

**Your RAG system is fully functional and ready to use!** 🎉

Start with `node ragSimple.js interactive` and ask your first question!

# 🚀 RAG Document System - Full Stack Web Application

A complete full-stack RAG (Retrieval Augmented Generation) system with a beautiful web interface for uploading documents, creating embeddings, and querying your knowledge base.

---

## 🎯 Features

### Frontend

- ✅ **Drag & Drop Upload** - Upload PDF files easily
- ✅ **Real-time Progress** - See upload and processing status
- ✅ **Live Statistics** - View document count, chunks, and vector dimensions
- ✅ **Interactive Search** - Query your documents with semantic search
- ✅ **Relevance Scores** - See how well each result matches your query
- ✅ **Source Attribution** - Know exactly which document and page answers came from
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Beautiful UI** - Modern gradient design with smooth animations

### Backend

- ✅ **REST API** - Express.js server with clean endpoints
- ✅ **PDF Processing** - Automatic text extraction from PDFs
- ✅ **Document Chunking** - Smart text splitting with overlap
- ✅ **Embeddings Creation** - Local embedding model (no API key needed)
- ✅ **Vector Storage** - Persistent vector database on disk
- ✅ **Semantic Search** - Cosine similarity matching
- ✅ **Multi-document Support** - Upload unlimited documents
- ✅ **CORS Enabled** - Ready for frontend integration

---

## 📁 Project Structure

```
Langchain/
├── server.js                 # Express server with API endpoints
├── public/
│   ├── index.html           # Main frontend page
│   ├── styles.css           # Beautiful styling
│   └── app.js               # Frontend JavaScript
├── vector_store/
│   └── embeddings.json      # Stored embeddings (auto-created)
├── uploads/                 # Uploaded files (auto-created)
├── files/                   # Original files directory
├── package.json             # Dependencies
└── .env                     # Environment variables
```

---

## 🚀 Quick Start

### 1. Start the Server

```bash
node server.js
```

The server will start on `http://localhost:3000`

### 2. Open in Browser

Navigate to: **http://localhost:3000**

### 3. Upload Documents

- Click "Choose File" or drag & drop PDFs
- Wait for processing (shows progress)
- Documents are automatically chunked and embedded

### 4. Query Your Documents

- Type your question in the query box
- Select number of results (3, 5, or 10)
- Click "Search 🔍"
- View results with relevance scores

---

## 🎨 User Interface

### Dashboard

- **Statistics Cards**: Shows total documents, chunks, and vector dimensions
- **Upload Section**: Drag & drop area with progress indicator
- **Document List**: See all uploaded documents
- **Query Section**: Search interface with results display

### Features

- **Beautiful Gradients**: Purple/blue theme
- **Smooth Animations**: Hover effects and transitions
- **Responsive Layout**: Adapts to screen size
- **Clear Feedback**: Success/error messages
- **Loading States**: Spinners and progress bars

---

## 🔌 API Endpoints

### GET /

Returns the frontend HTML page

### GET /api/stats

Get vector store statistics

**Response:**

```json
{
  "totalDocuments": 3,
  "totalChunks": 45,
  "dimensions": 384,
  "model": "Xenova/all-MiniLM-L6-v2",
  "createdAt": "2025-10-20T...",
  "files": ["document1.pdf", "document2.pdf"]
}
```

### POST /api/upload

Upload and process a PDF file

**Request:**

- `Content-Type: multipart/form-data`
- Field: `file` (PDF file, max 10MB)

**Response:**

```json
{
  "success": true,
  "message": "File processed successfully",
  "filename": "document.pdf",
  "pages": 5,
  "chunks": 15,
  "totalChunks": 45
}
```

### POST /api/query

Search the vector database

**Request:**

```json
{
  "query": "What is this document about?",
  "topK": 3
}
```

**Response:**

```json
{
  "query": "What is this document about?",
  "results": [
    {
      "content": "Document text content...",
      "source": "document.pdf",
      "page": "1",
      "similarity": "85.34",
      "chunkIndex": 0
    }
  ],
  "totalDocuments": 3
}
```

### DELETE /api/clear

Clear all documents and embeddings

**Response:**

```json
{
  "success": true,
  "message": "Vector store cleared"
}
```

---

## 🛠️ Technical Details

### Embedding Pipeline

1. **PDF Upload** → Multer middleware
2. **Text Extraction** → LangChain PDFLoader
3. **Document Chunking** → RecursiveCharacterTextSplitter
   - Chunk Size: 1000 characters
   - Overlap: 200 characters
4. **Embedding Creation** → Xenova/all-MiniLM-L6-v2
   - Dimensions: 384
   - Runs locally, no API key needed
5. **Vector Storage** → JSON file on disk
6. **Semantic Search** → Cosine similarity

### Technologies Used

**Backend:**

- Express.js - Web server
- Multer - File uploads
- LangChain - Document processing
- Xenova Transformers - Embeddings
- CORS - Cross-origin support

**Frontend:**

- Vanilla JavaScript - No frameworks
- Modern CSS - Gradients, animations
- Fetch API - REST calls
- Drag & Drop API - File uploads

---

## 📊 Performance

- **First Upload**: ~5-10 seconds (model download)
- **Subsequent Uploads**: ~2-3 seconds per document
- **Query Response**: <1 second
- **Model Size**: ~30MB (cached after first use)
- **Storage**: ~1MB per 100 document chunks

---

## 🎓 Usage Examples

### Example 1: Upload Research Papers

1. Upload multiple PDF research papers
2. Ask: "What are the main findings?"
3. Get relevant excerpts from all papers with sources

### Example 2: Product Documentation

1. Upload product manuals and guides
2. Ask: "How do I install this?"
3. Get step-by-step instructions with page numbers

### Example 3: Legal Documents

1. Upload contracts and legal documents
2. Ask: "What are the key terms?"
3. Find specific clauses with exact locations

---

## 🔧 Configuration

### Change Upload Limits

Edit `server.js`:

```javascript
limits: {
  fileSize: 20 * 1024 * 1024;
} // 20MB
```

### Adjust Chunking

Edit `server.js`:

```javascript
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1500, // Larger chunks
  chunkOverlap: 300, // More overlap
});
```

### Change Port

Edit `server.js`:

```javascript
const PORT = 8080; // Your preferred port
```

---

## 🆘 Troubleshooting

### Issue: Server won't start

**Solution:** Check if port 3000 is available

```bash
netstat -ano | findstr :3000
```

### Issue: Upload fails

**Solutions:**

- Check file size (must be < 10MB)
- Ensure it's a PDF file
- Check server logs for errors

### Issue: No search results

**Solutions:**

- Ensure documents are uploaded first
- Try rephrasing your query
- Check if vector store exists: `./vector_store/embeddings.json`

### Issue: Slow first upload

**Expected:** First upload downloads the embedding model (~30MB)
Subsequent uploads will be much faster

---

## 🚀 Production Deployment

### Recommendations

1. **Use a Real Database**

   - Replace JSON storage with PostgreSQL + pgvector
   - Or use Pinecone, Chroma, or Weaviate

2. **Add Authentication**

   - Implement user login
   - Secure API endpoints
   - Add rate limiting

3. **Scale Embeddings**

   - Use GPU for faster processing
   - Batch process multiple documents
   - Cache embedding model in memory

4. **Deploy**

   - Use PM2 for process management
   - Add NGINX reverse proxy
   - Enable HTTPS with Let's Encrypt
   - Use environment variables for config

5. **Monitor**
   - Add logging (Winston, Morgan)
   - Set up error tracking (Sentry)
   - Monitor performance metrics

---

## 📝 Example Queries to Try

### General

- "What is this document about?"
- "Summarize the main points"
- "What topics are covered?"

### Specific

- "What does it say about [topic]?"
- "Find information about [keyword]"
- "Where is [concept] mentioned?"

### Comparison

- "Compare these approaches"
- "What are the differences between..."
- "List the pros and cons"

---

## 🎯 Next Steps

1. ✅ **Add more documents** - Upload various PDFs
2. ✅ **Try different queries** - Test semantic search
3. ✅ **Monitor performance** - Check response times
4. ✅ **Customize UI** - Modify colors, layout
5. ✅ **Add features** - File preview, export results
6. ✅ **Integrate LLM** - Add GPT for answer generation
7. ✅ **Deploy** - Host on cloud platform

---

## 📄 License

ISC

---

## 🙏 Credits

Built with:

- [LangChain](https://js.langchain.com/) - Document processing
- [Xenova Transformers](https://github.com/xenova/transformers.js) - Embeddings
- [Express.js](https://expressjs.com/) - Web server
- [Multer](https://github.com/expressjs/multer) - File uploads

---

**Your RAG Document System is ready to use!** 🎉

Open http://localhost:3000 and start uploading documents!

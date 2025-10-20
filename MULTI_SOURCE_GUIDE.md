# Dynamic Multi-Source RAG System

## 🎯 Features

This enhanced RAG system now supports multiple input sources:

### Supported Input Types

1. **📄 PDF Files** - Upload PDF documents
2. **🌐 Web Pages** - Load content from any URL
3. **📊 CSV Files** - Process CSV data
4. **📋 JSON Files** - Load JSON documents
5. **📝 Text Files** - Upload TXT and Markdown files

## 🚀 How to Use

### 1. Upload Files

Click the **"Upload File"** tab and:
- Drag & drop files into the upload area
- Or click "Choose File" to browse
- Supported formats: `.pdf`, `.csv`, `.json`, `.txt`, `.md`

### 2. Load Web Pages

Click the **"Load URL"** tab and:
- Enter a webpage URL (e.g., `https://example.com/article`)
- Click "Load Webpage"
- The system will scrape the content and create embeddings

### 3. Query Your Data

- Enter your question in the query box
- Choose number of results (3, 5, or 10)
- Enable "AI Answer" for Gemini-powered responses
- Click "Search" or press Ctrl+Enter

## 🔧 Technical Details

### Document Loaders

The system uses LangChain's specialized loaders:

- **PlaywrightWebBaseLoader** - For web scraping
- **PDFLoader** - For PDF documents
- **CSVLoader** - For CSV files
- **JSONLoader** - For JSON data
- **TextLoader** - For plain text files

### Processing Pipeline

1. **Load** - Content loaded based on source type
2. **Split** - Documents split into 1000-char chunks (200 overlap)
3. **Embed** - Xenova/all-MiniLM-L6-v2 creates 384D vectors
4. **Store** - Embeddings saved to JSON vector store
5. **Query** - Cosine similarity search + optional Gemini AI

## 📡 API Endpoints

### POST /api/upload
Upload and process files (PDF, CSV, JSON, TXT, MD)

**Request:**
- FormData with file

**Response:**
```json
{
  "success": true,
  "filename": "document.pdf",
  "fileType": ".pdf",
  "documents": 45,
  "chunks": 88,
  "totalChunks": 88
}
```

### POST /api/process-url
Load and process webpage content

**Request:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com/article",
  "chunks": 15,
  "totalChunks": 103
}
```

## 🎨 Examples

### Loading a Wikipedia Article
```javascript
// Frontend
const url = "https://en.wikipedia.org/wiki/Machine_learning";
await processUrl(url);
```

### Uploading CSV Data
```javascript
// Upload a CSV file with customer data
// Each row becomes a searchable document
```

### Querying Combined Sources
```text
Query: "What are the main concepts of machine learning?"
Sources: 
- Wikipedia article (web)
- ML textbook.pdf (file)
- research_notes.csv (file)
```

## 🌟 Benefits

1. **Multi-Source Learning** - Combine web content, documents, and data
2. **Flexible Input** - No need to convert everything to PDF
3. **Web Integration** - Scrape documentation, articles, blogs
4. **Data Processing** - Query CSV/JSON data like documents
5. **Unified Search** - Single query searches all sources

## 🔐 Requirements

- Node.js 16+
- Playwright browsers (auto-installed)
- Google Gemini API key (for AI answers)
- 10MB max file size

## 📦 Dependencies

```bash
npm install @langchain/community playwright d3-dsv@2
npx playwright install
```

## 🎯 Use Cases

1. **Research** - Combine papers (PDF) + web articles + notes (TXT)
2. **Documentation** - Scrape docs websites + local markdown files
3. **Data Analysis** - Query CSV data using natural language
4. **Knowledge Base** - Mix internal docs + external resources
5. **Learning** - Combine textbooks + online tutorials + Q&A

## 🚀 Quick Start

1. Start the server:
```bash
node server.js
```

2. Open http://localhost:3000

3. Try it out:
   - Upload a PDF file
   - Load a Wikipedia article
   - Upload some CSV data
   - Query everything together!

## 🎓 Advanced Features

### Custom Chunk Sizes
Edit `documentLoaders.js` to adjust chunking:
```javascript
await splitDocuments(docs, 1500, 300); // Larger chunks
```

### Multiple URLs at Once
Process multiple webpages:
```javascript
const urls = [
  "https://example.com/page1",
  "https://example.com/page2"
];
for (const url of urls) {
  await processUrl(url);
}
```

### CSV with Custom Columns
CSV loader automatically handles all columns as metadata.

---

**Built with:** LangChain, Playwright, Xenova Transformers, Google Gemini

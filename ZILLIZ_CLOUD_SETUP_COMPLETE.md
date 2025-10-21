# Zilliz Cloud Integration - Quick Test Guide

## ✅ Successfully Connected!

Your RAG system is now using **Zilliz Cloud** (Serverless) in AWS EU Central-1.

**Endpoint**: `https://in03-41d7b3d5d924562.serverless.aws-eu-central-1.cloud.zilliz.com`  
**Collection**: `rag_documents`  
**Vector Dimension**: 384 (Xenova/all-MiniLM-L6-v2)

---

## 🧪 Test Your System

### 1. Start the Frontend

```powershell
cd client
npm run dev
```

Open: http://localhost:5173

### 2. Upload a Document

- Click the "Upload Document" button in the header
- Select a PDF, CSV, JSON, TXT, or MD file
- Wait for processing confirmation

### 3. Ask Questions

Type questions like:
- "What is this document about?"
- "Summarize the main points"
- "Explain [specific topic from your document]"

### 4. Try Web Scraping

Paste multiple URLs (one per line) and click "Process URLs":
```
https://example.com/article1
https://example.com/article2
https://example.com/article3
```

---

## 📊 API Endpoints

### Get Statistics
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/stats
```

### Query (Similarity Search)
```powershell
$body = @{query = "your question"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/query -Method Post -Body $body -ContentType "application/json"
```

### AI Query (with Gemini)
```powershell
$body = @{question = "your question"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/query-ai -Method Post -Body $body -ContentType "application/json"
```

### Clear Database
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/clear -Method Delete
```

---

## 🔍 Verify Milvus Cloud

1. **Login to Zilliz Cloud**: https://cloud.zilliz.com
2. **Check Collection**: Navigate to your cluster → Collections → `rag_documents`
3. **View Stats**: See row count, index status, and schema

---

## 🎯 What's Different from JSON Storage?

| Feature | JSON (Old) | Milvus Cloud (New) |
|---------|-----------|-------------------|
| **Storage** | Local file | Cloud database |
| **Scalability** | Limited by memory | Millions of vectors |
| **Search Speed** | O(n) - slow | O(log n) - fast |
| **Persistence** | Single file | Distributed storage |
| **Backup** | Manual | Automatic |
| **Access** | Single machine | Anywhere with credentials |

---

## 🚨 Troubleshooting

### Server Won't Start
```powershell
# Kill existing Node processes
taskkill /F /IM node.exe

# Restart
node server.js
```

### Connection Error
- Check `.env` file has correct `MILVUS_ADDRESS`
- Verify credentials in Zilliz Cloud dashboard
- Ensure SSL is enabled (already set in code)

### Slow Queries
- Cloud latency is normal for first query
- Subsequent queries are cached and faster
- Consider upgrading to dedicated cluster for production

---

## 📝 Configuration Files

### `.env`
```env
MILVUS_ADDRESS=https://in03-41d7b3d5d924562.serverless.aws-eu-central-1.cloud.zilliz.com
MILVUS_USER=db_41d7b3d5d924562
MILVUS_PASSWORD=Sq5(*r6[[j5zL3%*
GEMINI_API_KEY=AIzaSyBatm62XC5z936u14p6oao1fzVw7FaOZUA
```

### `milvusUtils.js`
- Token authentication: `username:password` format
- SSL enabled for cloud connections
- Auto-creates collection on first run

---

## 🎉 You're All Set!

Your production-ready RAG system is now:
- ✅ Connected to Zilliz Cloud
- ✅ Using vector database for fast searches
- ✅ Ready to handle multiple document types
- ✅ Powered by Google Gemini for AI answers
- ✅ Scalable to millions of documents

Happy querying! 🚀

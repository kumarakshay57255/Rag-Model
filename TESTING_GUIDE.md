# 🧪 Testing the Multi-Source RAG System

## Test Files Included

1. **test-data.csv** - Sample CSV with tech topics
2. **test-data.json** - Sample JSON with programming tutorials

## 🎯 Test Steps

### Test 1: Upload PDF
1. Open http://localhost:3000
2. Click "Upload File" tab
3. Drag and drop your PDF or click "Choose File"
4. Wait for processing
5. ✅ You should see: "Success! File: [filename], Chunks: X"

### Test 2: Load Webpage
1. Click "Load URL" tab
2. Try these URLs:
   - `https://en.wikipedia.org/wiki/Artificial_intelligence`
   - `https://www.example.com`
   - Any public webpage URL
3. Click "Load Webpage"
4. ✅ You should see: "Success! URL: [url], Chunks: X"

### Test 3: Upload CSV
1. Click "Upload File" tab  
2. Upload `test-data.csv`
3. ✅ Each row becomes a searchable document

### Test 4: Upload JSON
1. Click "Upload File" tab
2. Upload `test-data.json`
3. ✅ JSON properties/arrays become documents

### Test 5: Query Combined Sources
1. After uploading multiple sources:
   - PDF about JavaScript
   - Wikipedia article on AI
   - test-data.csv
   - test-data.json
2. Try queries like:
   - "What is machine learning?"
   - "Explain JavaScript"
   - "What are the basics of programming?"
3. ✅ Results should come from ALL sources

### Test 6: AI Answers
1. Check the "🤖 AI Answer" checkbox
2. Ask: "Explain the main concepts from these documents"
3. ✅ Google Gemini should generate a comprehensive answer

## 📊 What to Look For

### Successful Upload
```
✓ Success!
File: test-data.csv
Documents: 6
Chunks: 6
Total Chunks in DB: 94
```

### Successful URL Load
```
✓ Success!
URL: https://en.wikipedia.org/wiki/Artificial_intelligence
Chunks: 45
Total Chunks in DB: 139
```

### Query Results
- Should show similarity scores (0.0 to 1.0)
- Higher scores = more relevant
- Multiple sources should appear
- Source information should indicate file type

### AI Answer
- Coherent summary of relevant content
- Cites sources from multiple documents
- Powered by Google Gemini 2.5 Flash

## 🐛 Troubleshooting

### URL Loading Fails
- ✅ Check URL is public (not behind login)
- ✅ Try simpler URLs first (Wikipedia works great)
- ✅ Check internet connection
- ✅ Playwright may need time to load page

### CSV Not Processing
- ✅ Ensure CSV has headers
- ✅ Check file is valid CSV format
- ✅ UTF-8 encoding recommended

### JSON Not Loading
- ✅ Validate JSON syntax (use jsonlint.com)
- ✅ Check file is not too large (< 10MB)

### No Results When Querying
- ✅ Check documents were uploaded (see stats)
- ✅ Try broader query terms
- ✅ Verify embeddings were created

## 🎨 Expected Behavior

### File Icons
- 📄 PDF files
- 📊 CSV files
- 📋 JSON files
- 📝 TXT/MD files
- 🌐 Web URLs

### Stats Panel
- Documents count updates
- Chunks count increases
- Shows 384D vector size

### Processed Sources List
- Shows all uploaded files and URLs
- Different icons for different types
- URLs show full address
- Files show filename

## ⚡ Performance Notes

- **PDFs**: ~100ms per page
- **Web Pages**: 2-5 seconds (depends on page size)
- **CSV**: Fast (~50ms per row)
- **JSON**: Very fast (~20ms)
- **Embeddings**: ~50ms per chunk
- **Query**: ~100ms for search
- **AI Answer**: 2-5 seconds (Gemini API call)

## 🎯 Sample Queries to Try

After loading mixed sources:

1. **General**: "What are the main topics covered?"
2. **Specific**: "Explain machine learning algorithms"
3. **Cross-source**: "Compare Python and JavaScript"
4. **Technical**: "What are best practices for version control?"
5. **Conceptual**: "Describe cloud computing services"

## ✨ Success Criteria

✅ Can upload PDF, CSV, JSON files  
✅ Can load content from URLs  
✅ All sources appear in "Processed Sources"  
✅ Can query across all source types  
✅ AI answers integrate all sources  
✅ No errors in console  
✅ Stats update correctly  

---

**Happy Testing! 🚀**

If you encounter issues, check:
- Browser console (F12)
- Server terminal output
- Network tab in DevTools

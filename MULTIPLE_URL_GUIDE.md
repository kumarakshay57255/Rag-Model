# 🌐 Multiple URL Loading Feature

## Overview
The chatbot now supports loading multiple URLs at once! Simply paste multiple URLs in the chat, and the system will process them all sequentially.

## How to Use

### Single URL
Just paste one URL:
```
https://en.wikipedia.org/wiki/Machine_learning
```

### Multiple URLs (Space Separated)
Paste multiple URLs separated by spaces:
```
https://en.wikipedia.org/wiki/Machine_learning https://en.wikipedia.org/wiki/Deep_learning https://en.wikipedia.org/wiki/Neural_network
```

### Multiple URLs (Line Separated)
Paste URLs on separate lines:
```
https://docs.python.org/3/tutorial/
https://docs.python.org/3/library/
https://docs.python.org/3/reference/
```

### Mixed with Text
URLs can be mixed with text - they'll be automatically detected:
```
Load these resources:
https://example.com/doc1
https://example.com/doc2
```

## 🎯 Example Usage

### Research Multiple Topics
```
https://en.wikipedia.org/wiki/Artificial_intelligence
https://en.wikipedia.org/wiki/Machine_learning
https://en.wikipedia.org/wiki/Natural_language_processing
https://en.wikipedia.org/wiki/Computer_vision
```

Result:
```
🌐 Found 4 URL(s) to process...
[1/4] Processing: https://en.wikipedia.org/wiki/Artificial_intelligence
✅ Success! Created 45 chunks from this URL
[2/4] Processing: https://en.wikipedia.org/wiki/Machine_learning
✅ Success! Created 38 chunks from this URL
[3/4] Processing: https://en.wikipedia.org/wiki/Natural_language_processing
✅ Success! Created 32 chunks from this URL
[4/4] Processing: https://en.wikipedia.org/wiki/Computer_vision
✅ Success! Created 41 chunks from this URL

📊 Processing Complete!
✅ Success: 4/4
📦 Total chunks created: 156
```

### Load Documentation
```
https://react.dev/learn
https://react.dev/reference/react
https://react.dev/reference/react-dom
```

### Build Knowledge Base
```
Load these AI resources:
https://www.tensorflow.org/tutorials
https://pytorch.org/tutorials/
https://keras.io/guides/
```

## ⚡ Features

### Automatic URL Detection
- URLs are detected anywhere in your message
- Regex pattern: `/(https?:\/\/[^\s]+)/g`
- Works with http:// and https://

### Duplicate Removal
- Automatically removes duplicate URLs
- Processes each unique URL only once

### Progress Tracking
- Shows current progress: `[2/5]`
- Individual success/failure messages
- Final summary with statistics

### Error Handling
- Continues processing even if one URL fails
- Shows which URLs succeeded/failed
- Displays error messages for debugging

## 📊 Processing Details

### Sequential Processing
URLs are processed one at a time to:
- Avoid overwhelming the server
- Provide clear progress updates
- Allow Playwright to handle each page properly

### Timing
- Each URL takes 3-7 seconds
- Total time = URLs × 5 seconds (average)
- Example: 10 URLs ≈ 50 seconds

### Resource Usage
- Playwright opens one browser instance per URL
- Memory scales with page size
- Recommended: Process 5-10 URLs at once

## 🎨 UI Feedback

### Messages Shown
1. **Initial**: "🌐 Found X URL(s) to process..."
2. **Progress**: "[1/5] Processing: https://..."
3. **Success**: "✅ Success! Created X chunks..."
4. **Failure**: "❌ Failed: error message"
5. **Summary**: Final statistics

### Status Updates
- Real-time progress shown in chat
- Stats panel updates after completion
- Loading indicator while processing

## 💡 Best Practices

### ✅ Do's
- Group related URLs together
- Use public, accessible URLs
- Process 5-10 URLs at once
- Wait for completion before next batch

### ❌ Don'ts
- Don't paste 50+ URLs at once
- Avoid URLs behind login
- Don't include duplicate URLs
- Don't interrupt processing

## 🔧 Technical Details

### URL Extraction
```javascript
const urlRegex = /(https?:\/\/[^\s]+)/g;
const urls = userMessage.match(urlRegex);
```

### Deduplication
```javascript
const uniqueUrls = [...new Set(urls)];
```

### Processing Loop
```javascript
for (let i = 0; i < uniqueUrls.length; i++) {
  // Process each URL
  // Show progress
  // Handle errors
}
```

### Summary Generation
- Counts successes and failures
- Tracks total chunks created
- Updates stats automatically

## 🎯 Use Cases

### 1. Research Paper Collection
Paste multiple arXiv or research paper URLs to build a knowledge base

### 2. Documentation Scraping
Load entire documentation sites (multiple pages)

### 3. News Articles
Collect multiple news articles on a topic

### 4. Tutorial Series
Load all parts of a tutorial series

### 5. Blog Posts
Aggregate multiple blog posts on a subject

## 🐛 Troubleshooting

### Some URLs Fail?
- Check if URLs are public
- Verify URLs are accessible
- Try loading individually first
- Check for paywalls or login requirements

### Taking Too Long?
- Reduce number of URLs
- Try simpler pages first
- Check your internet connection
- Large pages take longer

### Duplicate Detection?
- URLs are normalized automatically
- Trailing slashes are preserved
- Query parameters are included

## 🚀 Performance Tips

### For Best Results:
1. **Batch Size**: 5-10 URLs per batch
2. **Page Type**: Simpler pages load faster
3. **Network**: Stable internet connection
4. **Wait Time**: Let each batch complete

### Optimization:
- Start with Wikipedia (fast, reliable)
- Test single URL first
- Group similar domains together
- Avoid very large pages

## 📈 Examples by Domain

### Wikipedia Articles
```
https://en.wikipedia.org/wiki/Python_(programming_language)
https://en.wikipedia.org/wiki/JavaScript
https://en.wikipedia.org/wiki/TypeScript
```

### Documentation Sites
```
https://docs.python.org/3/tutorial/introduction.html
https://docs.python.org/3/tutorial/controlflow.html
https://docs.python.org/3/tutorial/datastructures.html
```

### Tech Blogs
```
https://blog.example.com/post1
https://blog.example.com/post2
https://blog.example.com/post3
```

## 🎉 Success Patterns

### Research Mode
Load 5-10 related articles, then query across all of them

### Documentation Mode
Load all doc pages, then ask implementation questions

### Learning Mode
Load tutorial series, then ask step-by-step questions

---

**Pro Tip**: After loading multiple URLs, ask broad questions to see how the AI synthesizes information from all sources! 🚀

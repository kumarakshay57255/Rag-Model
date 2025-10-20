# 💬 RAG Chatbot - Interactive Chat Interface

## 🎯 Overview

A modern, interactive chatbot interface built with React that provides a conversational way to interact with your RAG (Retrieval-Augmented Generation) system.

## ✨ Features

### 🗨️ Chat Interface

- **Real-time Messaging**: Instant responses with typing indicators
- **Message History**: Full conversation context preserved
- **Source Attribution**: See which documents were used for each answer
- **Timestamps**: Track when each message was sent

### 📤 Multi-Modal Input

- **Text Queries**: Ask questions naturally
- **URL Loading**: Paste single or **multiple URLs** at once to load webpages
- **Batch URL Processing**: Load 5-10 URLs simultaneously
- **File Upload**: Drag-and-drop or click to upload documents
- **Supported Formats**: PDF, CSV, JSON, TXT, MD

### 🎨 Modern UI/UX

- **Clean Design**: Gradient purple/blue theme
- **Smooth Animations**: Message slide-ins and transitions
- **Responsive Layout**: Works on desktop and mobile
- **Auto-scroll**: Messages automatically scroll to bottom
- **Loading States**: Visual feedback during processing

### 🤖 AI-Powered

- **Context-Aware**: Uses conversation history
- **Source Citations**: Shows relevant document chunks
- **Similarity Scores**: Displays relevance percentage
- **Gemini Integration**: Powered by Google's latest AI

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ installed
- Backend server running on port 3000
- Google Gemini API key configured

### Installation

1. **Install dependencies:**

```bash
cd client
npm install
```

2. **Start the development server:**

```bash
npm run dev
```

3. **Open in browser:**

```
http://localhost:5173
```

## 📱 How to Use

### 1. Start Chatting

- Type your question in the input box
- Press Enter or click Send
- AI responds with relevant information

### 2. Load Documents

**Option A - File Upload:**

- Click the upload icon (📤) in header
- Select PDF, CSV, JSON, TXT, or MD file
- File is processed automatically

**Option B - URL Loading (Single):**

- Paste a URL directly in chat
- Example: `https://en.wikipedia.org/wiki/Machine_learning`
- Content is scraped and indexed

**Option C - Multiple URLs (NEW!):**

- Paste multiple URLs at once (space or line separated)
- Example:
  ```
  https://en.wikipedia.org/wiki/Machine_learning
  https://en.wikipedia.org/wiki/Deep_learning
  https://en.wikipedia.org/wiki/Neural_network
  ```
- System processes all URLs sequentially
- Shows progress for each URL
- Final summary with statistics
- See `MULTIPLE_URL_GUIDE.md` for detailed examples

### 3. View Sources

- Each AI response shows source documents
- Click to see which files/URLs were used
- Similarity scores show relevance

### 4. Track Progress

- Header shows document and chunk counts
- Updates in real-time as you add sources

## 🎨 UI Components

### ChatWindow

Main component containing:

- **Header**: Title, stats, upload button
- **Messages Container**: Scrollable chat history
- **Input Area**: Text input + send button
- **Hints**: Tips for using the interface

### Message Types

- **Bot Messages**: Purple gradient avatar (🤖)
- **User Messages**: Green avatar, right-aligned
- **System Messages**: Orange avatar for uploads

## 🔧 Technical Stack

### Frontend

- **React 19.1**: Latest React features
- **Vite**: Fast development and build
- **Lucide React**: Beautiful icon library
- **Axios**: HTTP client (if needed)
- **CSS3**: Modern styling with animations

### Backend Integration

- **REST API**: Connects to Express backend
- **Endpoints Used**:
  - `POST /api/query-ai` - Get AI answers
  - `POST /api/upload` - Upload files
  - `POST /api/process-url` - Load URLs
  - `GET /api/stats` - Get system stats

## 🎯 Example Conversations

### Research Query

```
You: What is machine learning?
Bot: Machine learning is a subset of artificial intelligence that...
📚 Sources:
- ML_textbook.pdf (95.3%)
- Wikipedia: Machine Learning (87.2%)
```

### Loading a URL

```
You: https://docs.python.org/3/tutorial/
Bot: 🌐 Loading content from URL...
Bot: ✅ Successfully loaded and processed!
     📊 Created 45 chunks
     💾 Total chunks: 133
```

### File Upload

```
[Upload button clicked]
System: 📤 Uploading research_paper.pdf...
Bot: ✅ Successfully processed research_paper.pdf!
     📄 .pdf file
     📦 Created 88 chunks
     💾 Total chunks: 221
```

### Multiple URLs (NEW!)

```
You: Load these AI resources:
     https://en.wikipedia.org/wiki/Machine_learning
     https://en.wikipedia.org/wiki/Deep_learning
     https://en.wikipedia.org/wiki/Neural_network

Bot: 🌐 Found 3 URL(s) to process...

Bot: [1/3] Processing: https://en.wikipedia.org/wiki/Machine_learning
Bot: ✅ Success! Created 38 chunks from this URL

Bot: [2/3] Processing: https://en.wikipedia.org/wiki/Deep_learning
Bot: ✅ Success! Created 42 chunks from this URL

Bot: [3/3] Processing: https://en.wikipedia.org/wiki/Neural_network
Bot: ✅ Success! Created 35 chunks from this URL

Bot: 📊 Processing Complete!
     ✅ Success: 3/3
     📦 Total chunks created: 115
```
     💾 Total chunks: 221
```

## 🎨 Customization

### Themes

Edit `ChatWindow.css` to customize:

- Colors: Change gradient in `.chat-container`
- Layout: Adjust padding, spacing
- Animations: Modify `@keyframes`

### Message Styles

```css
.message.bot {
  /* Bot message styling */
}

.message.user {
  /* User message styling */
}
```

### Avatar Icons

Change icons in `ChatWindow.jsx`:

```jsx
import { Bot, User, Send, Upload } from "lucide-react";
```

## 📊 Features Comparison

| Feature      | Old Web UI      | New Chat UI        |
| ------------ | --------------- | ------------------ |
| Upload Files | ✅ Drag-drop    | ✅ Button + inline |
| Load URLs    | ✅ Separate tab | ✅ Direct in chat  |
| Query        | ✅ Search box   | ✅ Conversational  |
| Results      | ✅ List view    | ✅ Chat bubbles    |
| History      | ❌              | ✅ Full history    |
| Sources      | ✅              | ✅ With scores     |
| AI Toggle    | ✅ Checkbox     | ✅ Always on       |

## 🚀 Performance

- **Initial Load**: < 1 second
- **Message Send**: ~100ms (excluding AI)
- **AI Response**: 2-5 seconds (Gemini)
- **File Upload**: 1-3 seconds per file
- **URL Scraping**: 3-7 seconds per page

## 🔐 Environment Variables

None needed in frontend - all configuration in backend.

## 📦 Build for Production

```bash
cd client
npm run build
```

Output in `client/dist/` folder.

## 🎓 Learning Resources

### Key Concepts Used:

1. **React Hooks**: useState, useEffect, useRef
2. **Async/Await**: For API calls
3. **CSS Animations**: Smooth transitions
4. **Responsive Design**: Mobile-first approach
5. **Component Architecture**: Modular design

### Files to Study:

- `ChatWindow.jsx` - Main component logic
- `ChatWindow.css` - Styling and animations
- `App.jsx` - Application entry point

## 🐛 Troubleshooting

### Chat not loading?

- Check backend is running on port 3000
- Verify CORS is enabled
- Check browser console for errors

### Messages not sending?

- Ensure backend API is accessible
- Check network tab in DevTools
- Verify API endpoints match

### File upload failing?

- Check file size < 100MB
- Verify file type is supported
- Check backend logs

### URLs not loading?

- Ensure URL is public
- Try simpler URLs first
- Check backend has Playwright installed

## 🎉 Next Steps

Planned features:

- [ ] Conversation export
- [ ] Message editing
- [ ] Voice input
- [ ] Dark/light theme toggle
- [ ] Multi-language support
- [ ] File preview
- [ ] Markdown rendering
- [ ] Code syntax highlighting

## 🤝 Contributing

Want to improve the chat interface?

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

**Built with ❤️ using React + Vite + LangChain**

🌟 Star the repo if you find it useful!

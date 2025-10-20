import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Upload, Globe, FileText, Database } from 'lucide-react';
import './ChatWindow.css';

const ChatWindow = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: '👋 Hi! I\'m your RAG-powered assistant. Upload documents, load URLs (paste multiple at once!), or ask me anything!',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ totalDocuments: 0, totalChunks: 0 });
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_BASE = 'http://localhost:3000/api';

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const addMessage = (type, content, metadata = {}) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date(),
      ...metadata
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage('user', userMessage);

    setIsLoading(true);

    try {
      // Check if message contains URLs (single or multiple)
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = userMessage.match(urlRegex);
      
      if (urls && urls.length > 0) {
        // Handle single or multiple URLs
        await handleMultipleURLs(urls);
      } else {
        // Regular query
        await handleQuery(userMessage);
      }
    } catch (error) {
      addMessage('bot', `❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuery = async (query) => {
    try {
      const response = await fetch(`${API_BASE}/query-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, topK: 3 }),
      });

      const data = await response.json();

      if (response.ok) {
        addMessage('bot', data.answer, {
          sources: data.sources,
          model: data.model
        });
      } else {
        throw new Error(data.error || 'Query failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleURLUpload = async (url) => {
    addMessage('bot', `🌐 Loading content from URL...`);

    try {
      const response = await fetch(`${API_BASE}/process-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (response.ok) {
        addMessage('bot', `✅ Successfully loaded and processed!\n📊 Created ${data.chunks} chunks\n💾 Total chunks: ${data.totalChunks}`);
        loadStats();
      } else {
        throw new Error(data.error || 'URL processing failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleMultipleURLs = async (urls) => {
    const uniqueUrls = [...new Set(urls)]; // Remove duplicates
    
    addMessage('bot', `🌐 Found ${uniqueUrls.length} URL(s) to process...`);

    let successCount = 0;
    let failCount = 0;
    let totalChunks = 0;

    for (let i = 0; i < uniqueUrls.length; i++) {
      const url = uniqueUrls[i];
      
      try {
        addMessage('bot', `[${i + 1}/${uniqueUrls.length}] Processing: ${url}`);

        const response = await fetch(`${API_BASE}/process-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (response.ok) {
          successCount++;
          totalChunks += data.chunks;
          addMessage('bot', `✅ Success! Created ${data.chunks} chunks from this URL`);
        } else {
          failCount++;
          addMessage('bot', `❌ Failed: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        failCount++;
        addMessage('bot', `❌ Error processing ${url}: ${error.message}`);
      }
    }

    // Summary message
    addMessage('bot', `
📊 Processing Complete!
✅ Success: ${successCount}/${uniqueUrls.length}
${failCount > 0 ? `❌ Failed: ${failCount}` : ''}
📦 Total chunks created: ${totalChunks}
    `.trim());

    loadStats();
  };

  const handleFileUpload = async (file) => {
    addMessage('system', `📤 Uploading ${file.name}...`);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        addMessage('bot', `✅ Successfully processed ${file.name}!\n📄 ${data.fileType} file\n📦 Created ${data.chunks} chunks\n💾 Total chunks: ${data.totalChunks}`);
        loadStats();
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      addMessage('bot', `❌ Upload error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message) => {
    const isBot = message.type === 'bot';
    const isSystem = message.type === 'system';

    return (
      <div key={message.id} className={`message ${message.type}`}>
        <div className="message-avatar">
          {isBot ? <Bot size={20} /> : isSystem ? <Database size={20} /> : <User size={20} />}
        </div>
        <div className="message-content">
          <div className="message-text">{message.content}</div>
          {message.sources && message.sources.length > 0 && (
            <div className="message-sources">
              <div className="sources-header">📚 Sources:</div>
              {message.sources.map((source, idx) => (
                <div key={idx} className="source-item">
                  <FileText size={14} />
                  <span>{source.source}</span>
                  <span className="similarity">({(source.similarity * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          )}
          <div className="message-timestamp">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <Bot className="header-icon" size={24} />
          <div>
            <h1>RAG Chatbot</h1>
            <p className="header-subtitle">
              📚 {stats.totalDocuments} sources • 📦 {stats.totalChunks} chunks
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="icon-button" 
            onClick={() => fileInputRef.current?.click()}
            title="Upload file"
          >
            <Upload size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.json,.txt,.md"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map(renderMessage)}
        {isLoading && (
          <div className="message bot">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <div className="input-wrapper">
          <textarea
            className="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question, paste URL(s), or upload a document..."
            rows={1}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
          >
            <Send size={20} />
          </button>
        </div>
        <div className="input-hints">
          <span>💡 Tip: Paste one or more URLs to load webpages, or click <Upload size={12} /> to upload files</span>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;

// API Base URL
const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const uploadResult = document.getElementById('uploadResult');
const filesList = document.getElementById('filesList');
const clearButton = document.getElementById('clearButton');
const queryInput = document.getElementById('queryInput');
const queryButton = document.getElementById('queryButton');
const queryResults = document.getElementById('queryResults');
const topKSelect = document.getElementById('topK');
const urlInput = document.getElementById('urlInput');
const processUrlButton = document.getElementById('processUrlButton');

// Tab elements
const tabButtons = document.querySelectorAll('.tab-button');
const fileTab = document.getElementById('fileTab');
const urlTab = document.getElementById('urlTab');

// Stats elements
const totalDocsEl = document.getElementById('totalDocs');
const totalChunksEl = document.getElementById('totalChunks');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });

    // File input
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // URL processing
    processUrlButton.addEventListener('click', handleUrlProcess);
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleUrlProcess();
        }
    });

    // Query
    queryButton.addEventListener('click', handleQuery);
    queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleQuery();
        }
    });

    // Clear button
    clearButton.addEventListener('click', handleClear);
}

// Switch Tabs
function switchTab(tabName) {
    // Update buttons
    tabButtons.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update content
    if (tabName === 'file') {
        fileTab.classList.add('active');
        urlTab.classList.remove('active');
    } else if (tabName === 'url') {
        urlTab.classList.add('active');
        fileTab.classList.remove('active');
    }
}

// Load Statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();

        totalDocsEl.textContent = data.totalDocuments || 0;
        totalChunksEl.textContent = data.totalChunks || 0;

        // Update files list
        if (data.files && data.files.length > 0) {
            displayFilesList(data.files);
            clearButton.style.display = 'block';
        } else {
            filesList.innerHTML = '<p class="empty-state">No sources processed yet</p>';
            clearButton.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Display Files List
function displayFilesList(files) {
    filesList.innerHTML = files.map(file => {
        // Handle both string (old format) and object (new format)
        const fileName = typeof file === 'string' ? file : file.name;
        const fileType = typeof file === 'string' ? 'file' : file.type;
        const icon = fileType === 'url' ? '🌐' : getFileIcon(fileName);

        return `
            <div class="file-item">
                <div class="file-icon">${icon}</div>
                <div class="file-info">
                    <div class="file-name">${fileName}</div>
                    ${fileType === 'url' ? '<div class="file-type">Webpage</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Get file icon based on extension
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': '📄',
        'csv': '📊',
        'json': '📋',
        'txt': '📝',
        'md': '📝'
    };
    return icons[ext] || '📁';
}

// Handle File Select
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file);
    }
}

// Handle Drag Over
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

// Handle Drag Leave
function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

// Handle Drop
function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    const validTypes = ['application/pdf', 'text/csv', 'application/json', 'text/plain', 'text/markdown'];

    if (file && validTypes.includes(file.type)) {
        uploadFile(file);
    } else {
        showAlert('Please drop a supported file (PDF, CSV, JSON, TXT, MD)', 'error');
    }
}

// Upload File
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    // Show progress
    uploadProgress.style.display = 'block';
    progressFill.style.width = '30%';
    progressText.textContent = 'Uploading file...';
    uploadResult.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });

        progressFill.style.width = '60%';
        progressText.textContent = 'Processing document...';

        const data = await response.json();

        progressFill.style.width = '100%';
        progressText.textContent = 'Creating embeddings...';

        if (response.ok) {
            setTimeout(() => {
                uploadProgress.style.display = 'none';
                const fileTypeLabel = data.fileType === '.pdf' ? 'Pages' : 'Documents';
                showAlert(`
                    <strong>✓ Success!</strong><br>
                    File: ${data.filename}<br>
                    ${data.documents ? `${fileTypeLabel}: ${data.documents}<br>` : ''}
                    Chunks: ${data.chunks}<br>
                    Total Chunks in DB: ${data.totalChunks}
                `, 'success');
                loadStats();
                fileInput.value = '';
            }, 500);
        } else {
            throw new Error(data.error || 'Upload failed');
        }

    } catch (error) {
        uploadProgress.style.display = 'none';
        showAlert(`Error: ${error.message}`, 'error');
    }
}

// Handle URL Process
async function handleUrlProcess() {
    const url = urlInput.value.trim();

    if (!url) {
        showAlert('Please enter a URL', 'error');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showAlert('Please enter a valid URL starting with http:// or https://', 'error');
        return;
    }

    // Show progress
    uploadProgress.style.display = 'block';
    progressFill.style.width = '30%';
    progressText.textContent = 'Loading webpage...';
    uploadResult.innerHTML = '';
    processUrlButton.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/process-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        progressFill.style.width = '60%';
        progressText.textContent = 'Processing content...';

        const data = await response.json();

        progressFill.style.width = '100%';
        progressText.textContent = 'Creating embeddings...';

        if (response.ok) {
            setTimeout(() => {
                uploadProgress.style.display = 'none';
                showAlert(`
                    <strong>✓ Success!</strong><br>
                    URL: ${data.url}<br>
                    Chunks: ${data.chunks}<br>
                    Total Chunks in DB: ${data.totalChunks}
                `, 'success');
                loadStats();
                urlInput.value = '';
                processUrlButton.disabled = false;
            }, 500);
        } else {
            throw new Error(data.error || 'URL processing failed');
        }

    } catch (error) {
        uploadProgress.style.display = 'none';
        showAlert(`Error: ${error.message}`, 'error');
        processUrlButton.disabled = false;
    }
}

// Handle Query
async function handleQuery() {
    const query = queryInput.value.trim();

    if (!query) {
        showAlert('Please enter a query', 'error');
        return;
    }

    const topK = parseInt(topKSelect.value);
    const useAI = document.getElementById('useAI').checked;

    // Show loading
    queryResults.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>${useAI ? 'Generating AI answer...' : 'Searching documents...'}</p>
        </div>
    `;
    queryButton.disabled = true;

    try {
        const endpoint = useAI ? `${API_BASE}/query-ai` : `${API_BASE}/query`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, topK })
        });

        const data = await response.json();

        if (response.ok) {
            if (useAI) {
                displayAIResults(data);
            } else {
                displayQueryResults(data);
            }
        } else {
            throw new Error(data.error || 'Query failed');
        }

    } catch (error) {
        queryResults.innerHTML = `
            <div class="alert alert-error">
                Error: ${error.message}
            </div>
        `;
    } finally {
        queryButton.disabled = false;
    }
}

// Display AI Results
function displayAIResults(data) {
    if (!data.answer) {
        queryResults.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>${data.message || 'No answer available'}</p>
            </div>
        `;
        return;
    }

    const resultsHTML = `
        <div class="result-header">
            <div class="result-query">
                <strong>🤖 AI Answer</strong> (powered by ${data.model || 'Google Gemini'})
            </div>
            <div class="result-meta">
                Query: "${data.query}"
            </div>
        </div>
        
        <div class="ai-answer-card">
            <div class="ai-answer-content">
                ${escapeHtml(data.answer).replace(/\n/g, '<br>')}
            </div>
        </div>
        
        ${data.results && data.results.length > 0 ? `
            <div class="sources-section">
                <h3>📚 Sources (${data.results.length} documents)</h3>
                ${data.results.map((result, index) => `
                    <div class="result-card">
                        <div class="result-header-info">
                            <div>
                                <div class="result-source">
                                    📄 ${result.source}
                                </div>
                                <div class="result-page">
                                    Page: ${result.page} | Chunk: ${result.chunkIndex + 1}
                                </div>
                            </div>
                            <div class="result-score">
                                ${result.similarity}% Match
                            </div>
                        </div>
                        <div class="result-content">
                            ${escapeHtml(result.content)}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;

    queryResults.innerHTML = resultsHTML;
}

// Display Query Results
function displayQueryResults(data) {
    if (!data.results || data.results.length === 0) {
        queryResults.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>${data.message || 'No results found'}</p>
            </div>
        `;
        return;
    }

    const resultsHTML = `
        <div class="result-header">
            <div class="result-query">
                <strong>Query:</strong> "${data.query}"
            </div>
            <div class="result-meta">
                Found ${data.results.length} relevant chunks from ${data.totalDocuments} document(s)
            </div>
        </div>
        
        ${data.results.map((result, index) => `
            <div class="result-card">
                <div class="result-header-info">
                    <div>
                        <div class="result-source">
                            📄 ${result.source}
                        </div>
                        <div class="result-page">
                            Page: ${result.page} | Chunk: ${result.chunkIndex + 1}
                        </div>
                    </div>
                    <div class="result-score">
                        ${result.similarity}% Match
                    </div>
                </div>
                <div class="result-content">
                    ${escapeHtml(result.content)}
                </div>
            </div>
        `).join('')}
    `;

    queryResults.innerHTML = resultsHTML;
}

// Show Alert
function showAlert(message, type) {
    uploadResult.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;

    setTimeout(() => {
        uploadResult.innerHTML = '';
    }, 5000);
}

// Handle Clear
async function handleClear() {
    if (!confirm('Are you sure you want to clear all documents and embeddings?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/clear`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('All documents cleared successfully', 'success');
            loadStats();
            queryResults.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💭</div>
                    <p>Enter a query to search your documents</p>
                </div>
            `;
        } else {
            throw new Error(data.error || 'Failed to clear documents');
        }
    } catch (error) {
        showAlert(`Error: ${error.message}`, 'error');
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

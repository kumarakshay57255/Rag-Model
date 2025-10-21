import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PlaywrightWebBaseLoader } from "@langchain/community/document_loaders/web/playwright";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';

/**
 * Load documents from a PDF file
 */
export async function loadPDF(filePath) {
    console.log(`📄 Loading PDF: ${filePath}`);
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    console.log(`✓ Loaded ${docs.length} pages from PDF`);
    return docs;
}

/**
 * Advanced web scraper with multiple fallback methods
 */
export async function loadWebPage(url) {
    console.log(`🌐 Loading webpage: ${url}`);
    
    // Method 1: Try Cheerio (fastest, works for most sites)
    try {
        console.log('  Trying Cheerio scraper...');
        const loader = new CheerioWebBaseLoader(url);
        const docs = await loader.load();
        if (docs && docs.length > 0 && docs[0].pageContent.trim().length > 100) {
            console.log(`✓ Loaded content from ${url} using Cheerio`);
            return docs;
        }
    } catch (error) {
        console.log('  Cheerio failed, trying next method...');
    }

    // Method 2: Try Axios + Custom Cheerio parsing (more control)
    try {
        console.log('  Trying Axios + Cheerio...');
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 15000,
        });

        const $ = cheerio.load(response.data);
        
        // Remove unwanted elements
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('footer').remove();
        $('header').remove();
        $('.advertisement').remove();
        $('#cookie-banner').remove();
        
        // Extract main content with priority
        let content = '';
        
        // Try common content containers
        const contentSelectors = [
            'article',
            'main',
            '[role="main"]',
            '.content',
            '.main-content',
            '#content',
            '#main',
            '.post-content',
            '.entry-content',
            'body'
        ];
        
        for (const selector of contentSelectors) {
            const element = $(selector);
            if (element.length > 0) {
                content = element.text();
                if (content.trim().length > 100) {
                    break;
                }
            }
        }
        
        // Extract title
        const title = $('title').text() || $('h1').first().text() || 'Untitled';
        
        // Clean up whitespace
        content = content.replace(/\s+/g, ' ').trim();
        
        if (content.length > 100) {
            console.log(`✓ Loaded content from ${url} using Axios (${content.length} chars)`);
            return [{
                pageContent: content,
                metadata: {
                    source: url,
                    title: title.trim(),
                    sourceType: 'url',
                    scrapedAt: new Date().toISOString(),
                }
            }];
        }
    } catch (error) {
        console.log('  Axios failed, trying next method...');
    }

    // Method 3: Fallback to Playwright (slower but handles JavaScript)
    try {
        console.log('  Trying Playwright (JS-enabled scraper)...');
        const loader = new PlaywrightWebBaseLoader(url, {
            launchOptions: {
                headless: true,
            },
            gotoOptions: {
                waitUntil: "networkidle",
                timeout: 30000,
            },
            evaluateOptions: {
                waitForSelector: "body",
            }
        });

        const docs = await loader.load();
        console.log(`✓ Loaded content from ${url} using Playwright`);
        return docs;
    } catch (error) {
        console.log('  Playwright failed');
        throw new Error(`Failed to scrape ${url} with all methods. Error: ${error.message}`);
    }
}

/**
 * Load documents from a CSV file
 */
export async function loadCSV(filePath) {
    console.log(`📊 Loading CSV: ${filePath}`);
    const loader = new CSVLoader(filePath);
    const docs = await loader.load();
    console.log(`✓ Loaded ${docs.length} rows from CSV`);
    return docs;
}

/**
 * Load documents from a JSON file
 */
export async function loadJSON(filePath) {
    console.log(`📋 Loading JSON: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(content);

    let docs = [];

    // Handle array of objects
    if (Array.isArray(jsonData)) {
        docs = jsonData.map((item, index) => ({
            pageContent: typeof item === 'string' ? item : JSON.stringify(item, null, 2),
            metadata: {
                source: filePath,
                line: index + 1,
                type: 'json'
            }
        }));
    }
    // Handle single object
    else if (typeof jsonData === 'object') {
        // Convert object properties to documents
        for (const [key, value] of Object.entries(jsonData)) {
            docs.push({
                pageContent: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
                metadata: {
                    source: filePath,
                    key: key,
                    type: 'json'
                }
            });
        }
    }
    // Handle simple string/number
    else {
        docs = [{
            pageContent: String(jsonData),
            metadata: {
                source: filePath,
                type: 'json'
            }
        }];
    }

    console.log(`✓ Loaded ${docs.length} items from JSON`);
    return docs;
}

/**
 * Load documents from a text file
 */
export async function loadTextFile(filePath) {
    console.log(`📝 Loading text file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const docs = [{
        pageContent: content,
        metadata: {
            source: filePath,
            type: 'text'
        }
    }];
    console.log(`✓ Loaded text file`);
    return docs;
}

/**
 * Detect file type and load accordingly
 */
export async function loadDocument(input) {
    // Check if input is a URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
        return await loadWebPage(input);
    }

    // Check if input is a file path
    const ext = path.extname(input).toLowerCase();

    switch (ext) {
        case '.pdf':
            return await loadPDF(input);
        case '.csv':
            return await loadCSV(input);
        case '.json':
            return await loadJSON(input);
        case '.txt':
        case '.md':
            return await loadTextFile(input);
        default:
            throw new Error(`Unsupported file type: ${ext}. Supported types: .pdf, .csv, .json, .txt, .md, or URLs`);
    }
}

/**
 * Split documents into chunks
 */
export async function splitDocuments(docs, chunkSize = 1000, chunkOverlap = 200) {
    console.log(`✂️  Splitting ${docs.length} documents into chunks...`);
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
    });

    const chunks = await textSplitter.splitDocuments(docs);
    console.log(`✓ Created ${chunks.length} chunks`);
    return chunks;
}

/**
 * Process any input (file or URL) - load and split into chunks
 */
export async function processInput(input, chunkSize = 1000, chunkOverlap = 200) {
    try {
        // Load documents
        const docs = await loadDocument(input);

        // Split into chunks
        const chunks = await splitDocuments(docs, chunkSize, chunkOverlap);

        return {
            success: true,
            chunks,
            metadata: {
                source: input,
                totalDocuments: docs.length,
                totalChunks: chunks.length
            }
        };
    } catch (error) {
        console.error(`❌ Error processing input: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

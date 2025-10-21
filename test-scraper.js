// Test the improved web scraper
import 'dotenv/config';
import { loadWebPage } from './documentLoaders.js';

async function testScraper() {
    const testUrls = [
        'https://example.com',
        'https://github.com',
        'https://stackoverflow.com/questions',
        'https://www.wikipedia.org',
    ];

    console.log('🧪 Testing Improved Web Scraper\n');
    console.log('Testing 3 fallback methods:');
    console.log('1. Cheerio (Fast, static content)');
    console.log('2. Axios + Custom Cheerio (Better content extraction)');
    console.log('3. Playwright (JS-enabled sites)\n');
    console.log('='.repeat(60));

    for (const url of testUrls) {
        try {
            console.log(`\n📍 Testing: ${url}`);
            const startTime = Date.now();
            
            const docs = await loadWebPage(url);
            const duration = Date.now() - startTime;
            
            if (docs && docs.length > 0) {
                const content = docs[0].pageContent;
                const preview = content.substring(0, 150).replace(/\s+/g, ' ');
                
                console.log(`✅ Success in ${duration}ms`);
                console.log(`   Content length: ${content.length} chars`);
                console.log(`   Preview: ${preview}...`);
            }
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
        console.log('-'.repeat(60));
    }

    console.log('\n✅ Scraper test complete!\n');
    process.exit(0);
}

testScraper();

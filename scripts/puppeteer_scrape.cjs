const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');

async function scrapeQuoiDeNeuf(targetCount = 50) {
    const url = 'https://megapc.tn/shop/quoi-de-neuf';
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    console.log(`📅 Scrape started on: ${dateStr}`);
    console.log(`Launching Chrome via puppeteer-stealth to scrape up to ${targetCount} products...`);

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
        timeout: 15000,
        defaultViewport: { width: 1280, height: 800 }
    });

    console.log('Browser launched in headless mode.');

    // Get the first automatically generated page
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Intercept API responses
    // Use a Map keyed by _id to prevent duplicates
    const capturedMap = new Map();
    page.on('response', async (response) => {
        const reqUrl = response.url();
        const method = response.request().method();
        
        if (['xhr', 'fetch'].includes(response.request().resourceType())) {
            // Log useful details but keep it clean
            if (reqUrl.includes('products_time_line') || reqUrl.includes('skip=')) {
                console.log(`Network Call: ${method} ${reqUrl} - Status: ${response.status()}`);
            }
        }
        
        const isDataEndpoint = reqUrl.includes('products_time_line') || reqUrl.includes('skip=');
        
        if (isDataEndpoint && response.status() === 200) {
            try {
                const json = await response.json();
                let newItems = [];
                if (Array.isArray(json)) {
                    newItems = json;
                } else if (json.products && Array.isArray(json.products)) {
                    newItems = json.products;
                } else if (json.data && Array.isArray(json.data)) {
                    newItems = json.data;
                }

                if (newItems.length > 0) {
                     const before = capturedMap.size;
                     newItems.forEach(p => { if (p._id) capturedMap.set(p._id, p); });
                     const added = capturedMap.size - before;
                     console.log(`  → Intercepted ${newItems.length} products (${added} new, ${newItems.length - added} dupes skipped). Total: ${capturedMap.size}`);
                }
            } catch {
                 // Ignore parsing errors for non-JSON or interrupted responses
            }
        }
    });

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Page loaded. Extracting __NEXT_DATA__ first...');
    await new Promise(r => setTimeout(r, 2000));

    // Get the first 10 items statically from the page load
    const nextData = await page.evaluate(() => {
        const el = document.getElementById('__NEXT_DATA__');
        return el ? JSON.parse(el.textContent) : null;
    });
    const initialProducts = nextData?.props?.pageProps?.initialProducts || [];
    if (initialProducts.length > 0) {
        initialProducts.forEach(p => { if (p._id) capturedMap.set(p._id, p); });
        console.log(`Got ${capturedMap.size} initial products from the DOM.`);
    }

    // Scroll to trigger more loads
    let lastCount = 0;
    let stalls = 0;
    
    let lastLogCount = 0;
    while (capturedMap.size < targetCount && stalls < 24) {
        console.log(`Scrolling gradually... (${capturedMap.size} collected so far)`);
        
        // Check if we passed a 100-product milestone to log the date and auto-save
        const currentSize = capturedMap.size;
        if (currentSize >= lastLogCount + 100) {
            lastLogCount = Math.floor(currentSize / 100) * 100;
            const capturedList = [...capturedMap.values()];
            const lastProduct = capturedList[capturedList.length - 1];
            
            // Incremental Save
            const outPath = path.join(process.cwd(), 'data', 'products.json');
            fs.writeFileSync(outPath, JSON.stringify(capturedList, null, 2));

            if (lastProduct && lastProduct.create_date) {
                const date = new Date(lastProduct.create_date);
                const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                console.log(`\n💾 Auto-saved ${currentSize} products. Most recent product date: ${dateStr}\n`);
            }
        }

        // Scroll to the bottom to trigger lazy loading
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        
        // Wait for potential API response
        await new Promise(r => setTimeout(r, 2500));
        
        if (capturedMap.size === lastCount) {
             stalls++;
             console.log(`No new products loaded (Stall ${stalls}/24). Nudging scroll...`);
             await page.evaluate(() => {
                 window.scrollBy(0, -500);
                 setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 500);
             });
             await new Promise(r => setTimeout(r, 1500));
        } else {
             stalls = 0; // Reset stall counter because we got new data
        }
        
        lastCount = capturedMap.size;
    }


    await browser.close();

    const capturedProducts = [...capturedMap.values()];
    const final = capturedProducts.slice(0, targetCount);
    console.log(`\n✅ Done! Captured ${final.length} products.`);
    final.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title || p.lien} — ${p.price ?? 'N/A'} TND`);
    });

    const outPath = path.join(__dirname, '..', 'data', 'products.json');
    fs.writeFileSync(outPath, JSON.stringify(final, null, 2));
    console.log(`\n💾 Saved to ${outPath}`);
    return final;
}

scrapeQuoiDeNeuf(10000).catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});

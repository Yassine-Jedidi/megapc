import 'dotenv/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { executablePath } from 'puppeteer';

// Initialize Puppeteer with Stealth
puppeteer.use(StealthPlugin());

// Initialize Prisma
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ScrapedProduct {
  _id: string;
  title?: string;
  title_fr?: string;
  miniDescription_fr?: string;
  price?: number | string;
  sale?: boolean;
  prixEnPromo?: string | number;
  discount?: string | number;
  stock?: number;
  new?: boolean;
  enArrivage?: boolean;
  devis?: boolean;
  commande48H?: boolean;
  checkStockWhenPurchased?: boolean;
  productpriv?: boolean;
  vue?: number;
  lien?: string;
  create_date?: string;
  categorie?: { _id: string; titre: string };
  filscateg?: { _id: string; titre: string };
  gallerie?: { urlPhoto: string[]; update_date?: string };
  update_date?: string;
}

interface ProductCacheItem {
  id: string;
  price: number | null;
  siteUpdateDate: Date | null;
}

async function getCategoryId(name: string, externalId?: string, catMap?: Map<string, string>) {
  if (!name) return undefined;
  if (catMap?.has(name)) return catMap.get(name);
  
  const cat = await prisma.category.upsert({
    where: { name },
    update: { externalId },
    create: { name, externalId },
  });
  
  catMap?.set(name, cat.id);
  return cat.id;
}

async function processProduct(
  item: ScrapedProduct, 
  catMap: Map<string, string>, 
  productCache: Map<string, ProductCacheItem>
) {
  const slug = item.lien || item._id;
  const title = item.title || item.title_fr || "Unknown Product";
  const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || null);
  
  const siteUpdateDate = item.update_date ? new Date(item.update_date) : (item.gallerie?.update_date ? new Date(item.gallerie.update_date) : null);
  const existingProduct = productCache.get(slug);

  // OPTIMIZATION: If product exists and update date hasn't changed, skip DB update
  if (existingProduct && siteUpdateDate && existingProduct.siteUpdateDate) {
    const datesMatch = siteUpdateDate.getTime() <= existingProduct.siteUpdateDate.getTime();
    if (datesMatch && existingProduct.price === price) {
      return { isNew: false, updated: false, skipped: true };
    }
    
    if (!datesMatch) {
      console.log(`   📅 Date Update: ${title} (${existingProduct.siteUpdateDate.toISOString()} -> ${siteUpdateDate.toISOString()})`);
    }
  }

  // 1. Sync Categories
  const categoryId = await getCategoryId(item.categorie?.titre || '', item.categorie?._id, catMap);
  const subCategoryId = await getCategoryId(item.filscateg?.titre || '', item.filscateg?._id, catMap);

  // 2. Upsert Product
  const product = await prisma.product.upsert({
    where: { slug: slug },
    update: {
      externalId: item._id,
      title: title,
      titleFr: item.title_fr || null,
      description: item.miniDescription_fr || null,
      price: price,
      onSale: !!item.sale || !!item.prixEnPromo,
      salePrice: item.prixEnPromo ? parseFloat(item.prixEnPromo.toString()) : null,
      discount: item.discount ? parseFloat(item.discount.toString()) : null,
      stock: item.stock || 0,
      isNew: !!item.new,
      isArriving: !!item.enArrivage,
      quoteMode: !!item.devis,
      commande48H: !!item.commande48H,
      checkStock: item.checkStockWhenPurchased ?? true,
      isPrivate: !!item.productpriv,
      viewCount: item.vue || 0,
      categoryId,
      subCategoryId,
      images: item.gallerie?.urlPhoto || [],
      siteCreateDate: item.create_date ? new Date(item.create_date) : null,
      siteUpdateDate: siteUpdateDate,
      rawData: item as unknown as object,
    },
    create: {
      externalId: item._id,
      slug: slug,
      title: title,
      titleFr: item.title_fr || null,
      description: item.miniDescription_fr || null,
      price: price,
      onSale: !!item.sale || !!item.prixEnPromo,
      salePrice: item.prixEnPromo ? parseFloat(item.prixEnPromo.toString()) : null,
      discount: item.discount ? parseFloat(item.discount.toString()) : null,
      stock: item.stock || 0,
      isNew: !!item.new,
      isArriving: !!item.enArrivage,
      quoteMode: !!item.devis,
      commande48H: !!item.commande48H,
      checkStock: item.checkStockWhenPurchased ?? true,
      isPrivate: !!item.productpriv,
      viewCount: item.vue || 0,
      categoryId,
      subCategoryId,
      images: item.gallerie?.urlPhoto || [],
      siteCreateDate: item.create_date ? new Date(item.create_date) : null,
      siteUpdateDate: siteUpdateDate,
      rawData: item as unknown as object,
    },
  });

  // 3. Price History Logic
  let priceChanged = false;
  if (!existingProduct || existingProduct.price !== price) {
    priceChanged = true;
    await prisma.priceHistory.create({
      data: { productId: product.id, price: price || 0 }
    });
    
    if (existingProduct) {
      console.log(`   💰 Price Change: ${existingProduct.price} -> ${price} TND`);
    } else {
      console.log(`   📈 Initial Price: ${price} TND`);
    }
  }

  if (existingProduct) {
    if (priceChanged) {
      console.log(`   🔄 Updated (Price Changed): ${title}`);
    } else {
      console.log(`   🔄 Updated (Site Date Changed): ${title}`);
    }
  } else {
    console.log(`   ✨ NEW PRODUCT: ${title}`);
  }

  // Update memory cache
  productCache.set(slug, { id: product.id, price, siteUpdateDate });

  return { isNew: !existingProduct, updated: true, skipped: false };
}

async function syncProducts() {
  console.log('🚀 Launching HEAVY-DUTY Full Sync...');
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // 1. Initial Caching
  console.log('📂 Pre-loading Category and Product cache...');
  const catMap = new Map<string, string>();
  const productCache = new Map<string, ProductCacheItem>();

  const [existingCats, existingProducts] = await Promise.all([
    prisma.category.findMany(),
    prisma.product.findMany({
      select: { id: true, slug: true, price: true, siteUpdateDate: true }
    })
  ]);

  existingCats.forEach(c => catMap.set(c.name, c.id));
  existingProducts.forEach(p => productCache.set(p.slug, { id: p.id, price: p.price, siteUpdateDate: p.siteUpdateDate }));
  console.log(`   ✅ Cache Loaded: ${existingCats.length} Categories, ${existingProducts.length} Products.`);

  let totalNew = 0;
  let totalUpdated = 0;
  let totalProcessed = 0;

  // Intercept data responses
  page.on('response', async (response) => {
    const url = response.url();
    const resourceType = response.request().resourceType();
    
    // LOG EVERY DATA REQUEST (To see what's happening)
    if (['xhr', 'fetch'].includes(resourceType)) {
       if (url.includes('products_time_line') || url.includes('skip=') || url.includes('getnveaupage')) {
         console.log(`📡 Network Intercept: ${url.split('?')[0]} (Status: ${response.status()})`);
       }
    }

    const isDataEndpoint = url.includes('getnveaupage') || 
                          url.includes('products_time_line') || 
                          url.includes('skip=');

    if (isDataEndpoint && response.status() === 200) {
      try {
        const json = await response.json();
        const rawItems: ScrapedProduct[] = Array.isArray(json) ? json : (json.products || json.data || []);
        
        if (rawItems.length > 0) {
          let batchNew = 0;
          let batchUpdated = 0;
          let batchSkipped = 0;

          for (const item of rawItems) {
            const result = await processProduct(item, catMap, productCache);
            if (result.isNew) batchNew++;
            else if (result.updated) batchUpdated++;
            else if (result.skipped) batchSkipped++;
          }
          
          const batchTotal = (batchNew + batchUpdated + batchSkipped);
          totalNew += batchNew;
          totalUpdated += batchUpdated;
          totalProcessed += batchTotal;
          
          console.log(`\n📦 Batch Processed: +${batchTotal} products`);
          console.log(`   Results: ${batchNew} New | ${batchUpdated} Updated | ${batchSkipped} Skipped`);
          console.log(`📊 Global Progress: ${totalProcessed} products processed`);
        }
      } catch { /* Not JSON or error */ }
    }
  });

  console.log('🌐 Navigating to Quoi de neuf...');
  await page.goto('https://www.megapc.tn/shop/quoi-de-neuf', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));

  // Initial products from __NEXT_DATA__
  const initialProducts = await page.evaluate(`(() => {
    const el = document.getElementById('__NEXT_DATA__');
    if (!el) return [];
    try {
      const data = JSON.parse(el.textContent || '{}');
      return data?.props?.pageProps?.initialProducts || [];
    } catch { return []; }
  })()`) as ScrapedProduct[];

  if (initialProducts.length > 0) {
    console.log(`✨ Syncing ${initialProducts.length} initial products...`);
    let initialNew = 0;
    let initialUpdated = 0;
    for (const item of initialProducts) {
      const result = await processProduct(item, catMap, productCache);
      if (result.isNew) initialNew++;
      if (result.updated) initialUpdated++;
      totalProcessed++;
    }
    totalNew += initialNew;
    totalUpdated += initialUpdated;
    console.log(`   Initial Load: ${initialNew} New, ${initialUpdated} Updated.`);
  }

  // Infinite Scroll Loop
  let scrollAttempts = 0;
  let lastProcessedCount = 0;

  console.log('\n🖱️ Starting Robust Scroll (matching .cjs logic)...');
  
  while (scrollAttempts < 24) { 
    console.log(`\n⬇️  Scrolling... (Stall ${scrollAttempts}/24)`);
    
    // Ported scroll logic from .cjs
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    
    // Wait for network
    await new Promise(r => setTimeout(r, 3000));
    
    if (totalProcessed === lastProcessedCount) {
      scrollAttempts++;
      console.log(`   ⚠️  No new products. Nudging (Up/Down)...`);
      await page.evaluate('window.scrollBy(0, -600)');
      await new Promise(r => setTimeout(r, 500));
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await new Promise(r => setTimeout(r, 1500));
    } else {
      scrollAttempts = 0; // Reset stall counter because we got new data
    }
    
    lastProcessedCount = totalProcessed;

    if (totalProcessed > 10000) break; // Absolute upper limit
  }

  console.log(`\n✅ Sync finished!`);
  console.log(`   - Total Processed: ${totalProcessed}`);
  console.log(`   - New Products: ${totalNew}`);
  console.log(`   - Database Updates: ${totalUpdated}`);
  await browser.close();
}

syncProducts()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  });

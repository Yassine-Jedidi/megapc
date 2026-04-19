import 'dotenv/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

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

async function processProduct(item: ScrapedProduct, catMap: Map<string, string>) {
  const slug = item.lien || item._id;
  const title = item.title || item.title_fr || "Unknown Product";
  const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || null);
  
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
      siteUpdateDate: item.update_date ? new Date(item.update_date) : (item.gallerie?.update_date ? new Date(item.gallerie.update_date) : null),
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
      siteUpdateDate: item.update_date ? new Date(item.update_date) : (item.gallerie?.update_date ? new Date(item.gallerie.update_date) : null),
      rawData: item as unknown as object,
    },
  });

  // 3. Price History Logic
  const lastPriceRecord = await prisma.priceHistory.findFirst({
    where: { productId: product.id },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastPriceRecord || lastPriceRecord.price !== price) {
    await prisma.priceHistory.create({
      data: { productId: product.id, price: price || 0 }
    });
    console.log(`📈 Price Recorded for ${slug}: ${price} TND`);
  }

  if (lastPriceRecord) {
    console.log(`   ✅ ${title}`);
  } else {
    console.log(`   ✨ NEW: ${title}`);
  }

  return { isNew: !lastPriceRecord };
}

async function syncProducts() {
  console.log('🚀 Launching Smart Puppeteer Sync...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  const catMap = new Map<string, string>();
  
  // Pre-fill catMap
  const existingCats = await prisma.category.findMany();
  existingCats.forEach(c => catMap.set(c.name, c.id));

  let stopTriggered = false;
  let totalNew = 0;

  // Intercept data responses
  page.on('response', async (response) => {
    if (stopTriggered) return;
    
    const url = response.url();
    if ((url.includes('getnveaupage') || url.includes('products_time_line')) && response.status() === 200) {
      try {
        const json = await response.json();
        const rawItems: ScrapedProduct[] = Array.isArray(json) ? json : (json.products || json.data || []);
        
        if (rawItems.length > 0) {
          console.log(`\n📦 Intercepted batch of ${rawItems.length} products...`);
          let existingInBatch = 0;

          for (const item of rawItems) {
            // Check if exists beforehand for the "Intelligent Stop" logic
            const exists = await prisma.product.findUnique({ where: { slug: item.lien || item._id } });
            if (exists) existingInBatch++;

            const result = await processProduct(item, catMap);
            if (result.isNew) totalNew++;
          }

          console.log(`   Processed: ${rawItems.length} Total | ${rawItems.length - existingInBatch} New | ${existingInBatch} Existing`);

          // STOP LOGIC: If a batch is mostly old data, we are done
          if (existingInBatch >= rawItems.length - 2 && rawItems.length > 5) {
            console.log('\n🛑 Intelligent Stop: Most products in this batch already exist.');
            stopTriggered = true;
          }
        }
      } catch {
        // Not JSON or error parsing
      }
    }
  });

  console.log('🌐 Navigating to Quoi de neuf...');
  await page.goto('https://www.megapc.tn/shop/quoi-de-neuf', { waitUntil: 'networkidle2' });

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
    console.log(`✨ Syncing ${initialProducts.length} initial products from page load...`);
    for (const item of initialProducts) {
      const result = await processProduct(item, catMap);
      if (result.isNew) totalNew++;
    }
  }

  // Scroll loop to trigger more data if not yet stopped
  let lastHeight = 0;
  let scrollAttempts = 0;

  while (!stopTriggered && scrollAttempts < 15) {
    lastHeight = await page.evaluate('document.body.scrollHeight') as number;
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    
    // Wait for network response
    await new Promise(r => setTimeout(r, 3000));
    
    const newHeight = await page.evaluate('document.body.scrollHeight') as number;
    if (newHeight === lastHeight) {
      scrollAttempts++;
    } else {
      scrollAttempts = 0;
    }
    
    if (stopTriggered) break;
  }

  console.log(`\n✅ Sync finished. Discovered ${totalNew} new products.`);
  await browser.close();
}

syncProducts()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  });

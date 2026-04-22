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
  title: string;
  description: string | null;
  price: number | null;
  discount: number | null;
  stock: number | null;
  onSale: boolean;
  salePrice: number | null;
  isArriving: boolean;
  isNew: boolean;
  quoteMode: boolean;
  commande48H: boolean;
  checkStock: boolean;
  isPrivate: boolean;
  cpu: string | null;
  gpu: string | null;
  siteUpdateDate: Date | null;
  hasHistory: boolean;
}

function extractSpecs(title: string, html: string): { cpu: string | null, gpu: string | null } {
  let cpu: string | null = null;
  let gpu: string| null = null;

  // 1. Try extracting from HTML miniDescription_fr
  if (html) {
    // Regex looking for common labels in French/English
    // We handle optional tags like <strong> after the colon
    const cpuRegex = /(?:Processeur|CPU|Processor)\s*:\s*(?:<[^>]*>)?\s*([^<]+)/i;
    const gpuRegex = /(?:Carte graphique|GPU|Graphics|VGA)\s*:\s*(?:<[^>]*>)?\s*([^<]+)/i;

    const cpuMatch = html.match(cpuRegex);
    const gpuMatch = html.match(gpuRegex);

    const clean = (s: string) => {
       const decode = (str: string) => str
         .replace(/&nbsp;/g, ' ')
         .replace(/&rsquo;/g, "'")
         .replace(/&agrave;/g, 'à')
         .replace(/&ndash;/g, '-')
         .replace(/&oelig;/g, 'oe')
         .replace(/&#39;/g, "'")
         .replace(/&trade;/g, '')
         .replace(/&reg;/g, '')
         .replace(/&bull;/g, '');

       const text = decode(s)
         .replace(/[\u{1F000}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
         .split(/[(\-,\u2013\u2014|]/)[0] // Truncate at logic separators
         .replace(/jusqu['’]à.*/i, '')
         .replace(/up to.*/i, '')
         // Strip brands to normalize models (optional, but requested for grouping)
         .replace(/^(?:msi|gigabyte|asus|pny|zotac|palit|sapphire|asrock|arktek|inno3d|evga|xfx|powercolor|nvidia|amd|intel|apple)\s+/gi, '')
         // Strip marketing/tech fluff
         .replace(/(?:box|tray|wraith stealth|wraith prism|edition|gaming|pro|dual|series|with any custom build|oc|overclocked|max|boost|turbo|windforce|ventus|twin edge|shadow|aero|eagle|suprim|tuf|rog|strix|master|elite|power|prime|liquid)/gi, '')
         // Strip Memory (8GB, 16Go, GDDR6, etc)
         .replace(/\s?\d+\s?(?:gb|go|mo|gddr\d|mb|bit|bits)\b/gi, '')
         .replace(/\s+/g, ' ')
         .trim();

       // Improved Blacklist for dimension and motherboards
       if (/\d+\s?mm|socket|lga|am\d|atx|pin|cable|broches|cache|tflops|reinforc|length|watt|tray|box|tray|box| ghz| mhz/i.test(text)) return null;
       if (text.length < 4 || text.length > 30) return null;
       
       return text;
    };

    if (cpuMatch) cpu = clean(cpuMatch[1]);
    if (gpuMatch) gpu = clean(gpuMatch[1]);
  }

  // 2. Fallback to Title parsing (Focus on identifiers)
  if (!cpu || !gpu) {
    const parts = title.split('|').map(p => p.trim());
    
    if (!cpu) {
      const cpuPart = parts.find(p => /intel\s*core|ryzen|apple\s*m[1235]/i.test(p));
      if (cpuPart) {
         const cleaned = cpuPart.split(/[(\-,\u2013\u2014|]/)[0]
            .replace(/^(?:msi|gigabyte|asus|pny|nvidia|amd|intel|apple)\s+/gi, '')
            .replace(/(?:box|tray|wraith|series|gaming)/gi, '').trim();
         if (cleaned.length >= 4) cpu = cleaned;
      }
    }
    
    if (!gpu) {
      const gpuPart = parts.find(p => /rtx\s*\d+|gtx\s*\d+|rx\s*\d+|radeon|geforce|arc\s*a\d+/i.test(p));
      if (gpuPart) {
         const cleaned = gpuPart.split(/[(\-,\u2013\u2014|]/)[0]
            .replace(/^(?:msi|gigabyte|asus|pny|zotac|palit|sapphire|nvidia|amd|intel|apple)\s+/gi, '')
            .replace(/(?:oc|gaming|edition|dual|series|windforce|ventus)/gi, '').trim();
         if (cleaned.length >= 4) gpu = cleaned;
      }
    }
  }

  const normalize = (val: string | null) => {
    if (!val) return null;
    // Special case for names like RTX, GTX, RX to keep them uppercase
    return val.replace(/\w\S*/g, (txt) => {
       if (/^(?:rtx|gtx|rx|gpu|cpu|lga|am\d)$/i.test(txt)) return txt.toUpperCase();
       return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  return { cpu: normalize(cpu), gpu: normalize(gpu) };
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
  
  // Extract Specs (CPU/GPU)
  const { cpu, gpu } = extractSpecs(title, item.miniDescription_fr || "");

  const existingProduct = productCache.get(slug);

  // OPTIMIZATION: If product exists and update date hasn't changed, skip DB update
  if (existingProduct && siteUpdateDate && existingProduct.siteUpdateDate) {
    const datesMatch = siteUpdateDate.getTime() <= existingProduct.siteUpdateDate.getTime();
    
    // Check if any critical attributes changed
    const titleMatch = existingProduct.title === title;
    const descriptionMatch = existingProduct.description === (item.miniDescription_fr || null);
    const priceMatch = existingProduct.price === price;
    const discountMatch = existingProduct.discount === (item.discount ? parseFloat(item.discount.toString()) : null);
    const stockMatch = existingProduct.stock === (item.stock || 0);
    const saleMatch = existingProduct.onSale === (!!item.sale || !!item.prixEnPromo);
    const salePriceMatch = existingProduct.salePrice === (item.prixEnPromo ? parseFloat(item.prixEnPromo.toString()) : null);
    const arrivingMatch = existingProduct.isArriving === !!item.enArrivage;
    const isNewMatch = existingProduct.isNew === !!item.new;
    const quoteModeMatch = existingProduct.quoteMode === !!item.devis;
    const commande48HMatch = existingProduct.commande48H === !!item.commande48H;
    const checkStockMatch = existingProduct.checkStock === (item.checkStockWhenPurchased ?? true);
    const isPrivateMatch = existingProduct.isPrivate === !!item.productpriv;
    const cpuMatch = existingProduct.cpu === cpu;
    const gpuMatch = existingProduct.gpu === gpu;

    if (datesMatch && titleMatch && descriptionMatch && priceMatch && discountMatch && stockMatch && saleMatch && salePriceMatch && arrivingMatch && isNewMatch && quoteModeMatch && commande48HMatch && checkStockMatch && isPrivateMatch && cpuMatch && gpuMatch) {
      return { isNew: false, updated: false, skipped: true };
    }
    
    if (!datesMatch) {
      console.log(`   📅 Date Update: ${title} (${existingProduct.siteUpdateDate.toISOString()} -> ${siteUpdateDate.toISOString()})`);
    } else {
      // Attribute change without date update
      const changes = [];
      if (!titleMatch) changes.push(`Title changed`);
      if (!descriptionMatch) changes.push(`Description changed`);
      if (!priceMatch) changes.push(`Price: ${existingProduct.price} -> ${price}`);
      if (!discountMatch) changes.push(`Discount: ${existingProduct.discount} -> ${item.discount}`);
      if (!stockMatch) changes.push(`Stock: ${existingProduct.stock} -> ${item.stock || 0}`);
      if (!saleMatch || !salePriceMatch) changes.push(`Sale status changed`);
      if (!arrivingMatch) changes.push(`Arriving: ${existingProduct.isArriving} -> ${!!item.enArrivage}`);
      if (!cpuMatch) changes.push(`CPU: ${existingProduct.cpu} -> ${cpu}`);
      if (!gpuMatch) changes.push(`GPU: ${existingProduct.gpu} -> ${gpu}`);
      
      console.log(`   🔄 Attribute Update (No date change): ${title} [${changes.join(', ')}]`);
    }
  }

  // 1. Sync Categories
  const categoryId = await getCategoryId(item.categorie?.titre || '', item.categorie?._id, catMap);
  const subCategoryId = await getCategoryId(item.filscateg?.titre || '', item.filscateg?._id, catMap);

  // 2. Upsert Product
  const product = await prisma.product.upsert({
    where: { slug: slug },
    update: {
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
      cpu,
      gpu,
      images: item.gallerie?.urlPhoto || [],
      siteCreateDate: item.create_date ? new Date(item.create_date) : null,
      siteUpdateDate: siteUpdateDate,
      hasHistory: existingProduct?.hasHistory || false,
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
      cpu,
      gpu,
      images: item.gallerie?.urlPhoto || [],
      siteCreateDate: item.create_date ? new Date(item.create_date) : null,
      siteUpdateDate: siteUpdateDate,
      hasHistory: false,
      rawData: item as unknown as object,
    },
  });

  // 3. Price History Logic
  let priceChanged = false;
  let nowHasHistory = existingProduct?.hasHistory || false;

  if (!existingProduct || existingProduct.price !== price) {
    priceChanged = true;
    await prisma.priceHistory.create({
      data: { productId: product.id, price: price || 0 }
    });
    
    // If it's an existing product and price changed, it now definitely has history
    if (existingProduct) {
      nowHasHistory = true;
      await prisma.product.update({
        where: { id: product.id },
        data: { hasHistory: true }
      });
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
  productCache.set(slug, { 
    id: product.id, 
    title: product.title,
    description: product.description,
    price, 
    discount: product.discount,
    stock: product.stock,
    onSale: product.onSale,
    salePrice: product.salePrice,
    isArriving: product.isArriving,
    isNew: product.isNew,
    quoteMode: product.quoteMode,
    commande48H: product.commande48H,
    checkStock: product.checkStock,
    isPrivate: product.isPrivate,
    cpu: product.cpu,
    gpu: product.gpu,
    siteUpdateDate, 
    hasHistory: nowHasHistory 
  });

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
      select: { 
        id: true, 
        slug: true, 
        title: true,
        description: true,
        price: true, 
        discount: true,
        stock: true,
        onSale: true,
        salePrice: true,
        isArriving: true,
        isNew: true,
        quoteMode: true,
        commande48H: true,
        checkStock: true,
        isPrivate: true,
        cpu: true,
        gpu: true,
        siteUpdateDate: true, 
        hasHistory: true 
      }
    })
  ]);

  existingCats.forEach(c => catMap.set(c.name, c.id));
  existingProducts.forEach(p => productCache.set(p.slug, { 
    id: p.id, 
    title: p.title,
    description: p.description,
    price: p.price, 
    discount: p.discount,
    stock: p.stock,
    onSale: p.onSale,
    salePrice: p.salePrice,
    isArriving: p.isArriving,
    isNew: p.isNew,
    quoteMode: p.quoteMode,
    commande48H: p.commande48H,
    checkStock: p.checkStock,
    isPrivate: p.isPrivate,
    cpu: p.cpu,
    gpu: p.gpu,
    siteUpdateDate: p.siteUpdateDate,
    hasHistory: p.hasHistory 
  }));
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

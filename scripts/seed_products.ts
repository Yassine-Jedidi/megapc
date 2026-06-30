import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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
    attributes?: { cle: string; valeur: string }[];
  update_date?: string;
}

function extractSpecs(title: string, html: string): { cpu: string | null, gpu: string | null } {
  let cpu: string | null = null;
  let gpu: string| null = null;

  if (html) {
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
         .split(/[(\-,\u2013\u2014|]/)[0]
         .replace(/jusqu['’]à.*/i, '')
         .replace(/up to.*/i, '')
         .replace(/^(?:msi|gigabyte|asus|pny|zotac|palit|sapphire|asrock|arktek|inno3d|evga|xfx|powercolor|nvidia|amd|intel|apple)\s+/gi, '')
         .replace(/(?:box|tray|wraith stealth|wraith prism|edition|gaming|pro|dual|series|with any custom build|oc|overclocked|max|boost|turbo|windforce|ventus|twin edge|shadow|aero|eagle|suprim|tuf|rog|strix|master|elite|power|prime|liquid)/gi, '')
         .replace(/\s?\d+\s?(?:gb|go|mo|gddr\d|mb|bit|bits)\b/gi, '')
         .replace(/\s+/g, ' ')
         .trim();

       if (/\d+\s?mm|socket|lga|am\d|atx|pin|cable|broches|cache|tflops|reinforc|length|watt|tray|box|tray|box| ghz| mhz/i.test(text)) return null;
       if (text.length < 4 || text.length > 30) return null;
       
       return text;
    };

    if (cpuMatch) cpu = clean(cpuMatch[1]);
    if (gpuMatch) gpu = clean(gpuMatch[1]);
  }

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
    return val.replace(/\w\S*/g, (txt) => {
       if (/^(?:rtx|gtx|rx|gpu|cpu|lga|am\d)$/i.test(txt)) return txt.toUpperCase();
       return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  return { cpu: normalize(cpu), gpu: normalize(gpu) };
}

async function main() {
    const dataPath = path.join(process.cwd(), 'data', 'products.json');
    if (!fs.existsSync(dataPath)) {
        console.error(`❌ Data file not found at ${dataPath}`);
        return;
    }

    console.log('📖 Reading scraped data...');
    const rawData: ScrapedProduct[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`🚀 Seeding ${rawData.length} products with High-Performance Parallelization...`);

    // 1. Pre-fetch and cache categories to avoid redundant DB hits
    console.log('📦 Pre-fetching categories...');
    const existingCats = await prisma.category.findMany();
    const catMap = new Map(existingCats.map(c => [c.name, c.id]));

    const getCategoryId = async (name: string, externalId?: string) => {
        if (!name) return undefined;
        if (catMap.has(name)) return catMap.get(name);
        
        const slug = toSlug(name);
        try {
            const cat = await prisma.category.upsert({
                where: { name },
                update: { externalId, slug },
                create: { name, slug, externalId },
            });
            catMap.set(name, cat.id);
            return cat.id;
        } catch (e) {
            // Handle case where externalId is already taken by a category with a different name
            if (externalId) {
                const existing = await prisma.category.findUnique({ where: { externalId } });
                if (existing) {
                    catMap.set(name, existing.id);
                    return existing.id;
                }
            }
            throw e;
        }
    };

    // 2. High-Performance Processing in Chunks
    const CHUNK_SIZE = 20; // 20 concurrent operations is safe for Neon's connection pool
    let processedCount = 0;

    for (let i = 0; i < rawData.length; i += CHUNK_SIZE) {
        const chunk = rawData.slice(i, i + CHUNK_SIZE);
        
        await Promise.all(chunk.map(async (item: ScrapedProduct) => {
            const slug = item.lien || item._id;
            const title = item.title || item.title_fr || "Unknown Product";
            const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || null);
            const parsedSalePrice = item.prixEnPromo ? parseFloat(item.prixEnPromo.toString()) : null;
            // Only set salePrice/discount if there's a genuine promo (parsedSalePrice strictly < price)
            // Non-promo items keep salePrice=null, discount=null.
            // Price sorts use the `price` column (always set), not salePrice.
            let salePrice: number | null = null;
            let discount: number | null = null;
            if (price && parsedSalePrice && parsedSalePrice < price) {
                salePrice = parsedSalePrice;
                discount = ((price - salePrice) / price) * 100;
            }
            const images = item.gallerie?.urlPhoto || [];
            
            // Extract Specs (CPU/GPU)
            const { cpu, gpu } = extractSpecs(title, item.miniDescription_fr || "");
            
            try {
                // Resolve categories using cache
                const categoryId = await getCategoryId(item.categorie?.titre || '', item.categorie?._id);
                const subCategoryId = await getCategoryId(item.filscateg?.titre || '', item.filscateg?._id);

                // Upsert Product
                const product = await prisma.product.upsert({
                    where: { slug: slug } as any,
                    update: {
                        externalId: item._id,
                        slug: slug,
                        title: title,
                        titleFr: item.title_fr || null,
                        description: item.miniDescription_fr || null,
                        price: price,
                        onSale: !!item.sale || discount !== null,
                        salePrice: salePrice,
                        discount: discount,
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
                        images,
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
                        onSale: !!item.sale || discount !== null,
                        salePrice: salePrice,
                        discount: discount,
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
                        images,
                        siteCreateDate: item.create_date ? new Date(item.create_date) : null,
                        siteUpdateDate: item.update_date ? new Date(item.update_date) : (item.gallerie?.update_date ? new Date(item.gallerie.update_date) : null),
                        rawData: item as unknown as object,
                    },
                });

                // Smart Price History Check
                const lastPriceRecord = await prisma.priceHistory.findFirst({
                    where: { productId: product.id },
                    orderBy: { createdAt: 'desc' }
                });

                if (!lastPriceRecord || lastPriceRecord.price !== price) {
                    await prisma.priceHistory.create({
                        data: { productId: product.id, price: price || 0 }
                    });
                }
            } catch (e) {
                console.error(`  ⚠️ Skipped ${slug}: ${e instanceof Error ? e.message : 'Error'}`);
            }
        }));

        processedCount += chunk.length;
        if (processedCount % 100 === 0 || processedCount === rawData.length) {
            console.log(`  ⚡ Handled ${processedCount}/${rawData.length} products...`);
        }
    }

    console.log(`\n✅ High-Speed Seeding Complete!`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

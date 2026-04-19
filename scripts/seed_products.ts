import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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
    gallerie?: { urlPhoto: string[] };
    attributes?: { cle: string; valeur: string }[];
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
        
        try {
            const cat = await prisma.category.upsert({
                where: { name },
                update: { externalId },
                create: { name, externalId },
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
            const images = item.gallerie?.urlPhoto || [];
            
            try {
                // Resolve categories using cache
                const categoryId = await getCategoryId(item.categorie?.titre || '', item.categorie?._id);
                const subCategoryId = await getCategoryId(item.filscateg?.titre || '', item.filscateg?._id);

                // Upsert Product
                const product = await prisma.product.upsert({
                    where: { slug: slug },
                    update: {
                        externalId: item._id,
                        title: title,
                        titleFr: item.title_fr || null,
                        description: item.miniDescription_fr || null,
                        price: price,
                        onSale: !!item.sale,
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
                        images,
                        siteCreateDate: item.create_date ? new Date(item.create_date) : null,
                        rawData: item as unknown as object,
                    },
                    create: {
                        externalId: item._id,
                        slug: slug,
                        title: title,
                        titleFr: item.title_fr || null,
                        description: item.miniDescription_fr || null,
                        price: price,
                        onSale: !!item.sale,
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
                        images,
                        siteCreateDate: item.create_date ? new Date(item.create_date) : null,
                        rawData: item as unknown as object,
                    },
                });

                // Attributes and Price History (still sequential per-product to maintain integrity)
                if (item.attributes?.length) {
                    await Promise.all(item.attributes.map((attr) => 
                        prisma.attribute.upsert({
                            where: { productId_key: { productId: product.id, key: attr.cle.toString() } },
                            update: { value: attr.valeur.toString() },
                            create: { productId: product.id, key: attr.cle.toString(), value: attr.valeur.toString() }
                        })
                    ));
                }

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

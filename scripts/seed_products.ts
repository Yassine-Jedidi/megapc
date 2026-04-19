import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const dataPath = path.join(process.cwd(), 'data', 'products.json');
    
    if (!fs.existsSync(dataPath)) {
        console.error(`❌ Data file not found at ${dataPath}`);
        return;
    }

    console.log('📖 Reading scraped data...');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    console.log(`🚀 Seeding ${rawData.length} products to Neon (Final PERFECT V3 Schema)...`);

    let count = 0;
    for (const item of rawData) {
        const slug = item.lien || item._id;
        const title = item.title || item.title_fr || "Unknown Product";
        const price = item.price ? parseFloat(item.price) : null;
        const stock = typeof item.stock === 'number' ? item.stock : 0;
        const images = item.gallerie?.urlPhoto || [];
        const siteCreateDate = item.create_date ? new Date(item.create_date) : null;

        try {
            // 1. Map Category
            let categoryId: string | undefined = undefined;
            if (item.categorie?.titre) {
                const cat = await prisma.category.upsert({
                    where: { name: item.categorie.titre },
                    update: { externalId: item.categorie._id },
                    create: { name: item.categorie.titre, externalId: item.categorie._id },
                });
                categoryId = cat.id;
            }

            // 2. Map Sub-Category
            let subCategoryId: string | undefined = undefined;
            if (item.filscateg?.titre) {
                const subCat = await prisma.category.upsert({
                    where: { name: item.filscateg.titre },
                    update: { externalId: item.filscateg._id },
                    create: { name: item.filscateg.titre, externalId: item.filscateg._id },
                });
                subCategoryId = subCat.id;
            }

            // 3. Upsert Product
            const product = await prisma.product.upsert({
                where: { slug: slug },
                update: {
                    externalId: item._id,
                    title: title,
                    titleFr: item.title_fr || null,
                    description: item.miniDescription_fr || null,
                    price: price,
                    onSale: !!item.sale,
                    salePrice: item.prixEnPromo ? parseFloat(item.prixEnPromo) : null,
                    discount: item.discount ? parseFloat(item.discount) : null,
                    stock: stock,
                    isNew: !!item.new,
                    isArriving: !!item.enArrivage,
                    quoteMode: !!item.devis,
                    commande48H: !!item.commande48H,
                    checkStock: item.checkStockWhenPurchased ?? true,
                    isPrivate: !!item.productpriv,
                    viewCount: item.vue || 0,
                    categoryId: categoryId,
                    subCategoryId: subCategoryId,
                    images: images,
                    siteCreateDate: siteCreateDate,
                    rawData: item,
                },
                create: {
                    externalId: item._id,
                    slug: slug,
                    title: title,
                    titleFr: item.title_fr || null,
                    description: item.miniDescription_fr || null,
                    price: price,
                    onSale: !!item.sale,
                    salePrice: item.prixEnPromo ? parseFloat(item.prixEnPromo) : null,
                    discount: item.discount ? parseFloat(item.discount) : null,
                    stock: stock,
                    isNew: !!item.new,
                    isArriving: !!item.enArrivage,
                    quoteMode: !!item.devis,
                    commande48H: !!item.commande48H,
                    checkStock: item.checkStockWhenPurchased ?? true,
                    isPrivate: !!item.productpriv,
                    viewCount: item.vue || 0,
                    categoryId: categoryId,
                    subCategoryId: subCategoryId,
                    images: images,
                    siteCreateDate: siteCreateDate,
                    rawData: item,
                },
            });

            // 4. Map Attributes (key-value pairs)
            if (item.attributes && Array.isArray(item.attributes)) {
                for (const attr of item.attributes) {
                    if (attr.cle && attr.valeur) {
                        await prisma.attribute.upsert({
                            where: {
                                productId_key: {
                                    productId: product.id,
                                    key: attr.cle
                                }
                            },
                            update: { value: attr.valeur },
                            create: {
                                productId: product.id,
                                key: attr.cle,
                                value: attr.valeur
                            }
                        });
                    }
                }
            }

            // 5. Track Price history
            const lastPrice = await prisma.priceHistory.findFirst({
                where: { productId: product.id },
                orderBy: { createdAt: 'desc' }
            });

            if (!lastPrice || lastPrice.price !== price) {
                await prisma.priceHistory.create({
                    data: {
                        productId: product.id,
                        price: price || 0,
                    }
                });
            }

            count++;
            if (count % 10 === 0) console.log(`  Processed ${count} products...`);
        } catch (e) {
            if (e instanceof Error) {
                console.error(`  ⚠️ Failed to upsert ${slug}:`, e.message);
            } else {
                console.error(`  ⚠️ Failed to upsert ${slug}:`, String(e));
            }
        }
    }

    console.log(`\n✅ Done! PERFECT SYNC completed.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

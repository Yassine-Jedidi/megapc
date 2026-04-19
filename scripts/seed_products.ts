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
    
    console.log(`🚀 Seeding ${rawData.length} products to Neon via PostgreSQL adapter...`);

    let count = 0;
    for (const item of rawData) {
        const slug = item.lien || item._id;
        const title = item.title || item.title_fr || "Unknown Product";
        const price = item.price ? parseFloat(item.price) : null;
        const stock = typeof item.stock === 'number' ? item.stock : 0;
        const imageUrl = item.gallerie?.urlPhoto?.[0] || null;
        const category = item.categorie?.titre || null;

        try {
            await prisma.product.upsert({
                where: { slug: slug },
                update: {
                    price: price,
                    stock: stock,
                    title: title,
                    imageUrl: imageUrl,
                    category: category,
                    rawData: item,
                },
                create: {
                    slug: slug,
                    title: title,
                    price: price,
                    stock: stock,
                    imageUrl: imageUrl,
                    category: category,
                    rawData: item,
                },
            });
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

    console.log(`\n✅ Done! Successfully synced ${count} products to the database.`);
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

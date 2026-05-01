import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrateTrends() {
  console.log("🔍 Finding products with history to calculate trends...");
  
  const products = await prisma.product.findMany({
    where: { hasHistory: true },
    select: { 
      id: true, 
      title: true,
      priceHistory: {
        orderBy: { createdAt: 'desc' },
        take: 2
      }
    }
  });

  console.log(`Found ${products.length} products to analyze.`);
  
  let updatedCount = 0;
  let ascCount = 0;
  let descCount = 0;

  for (const product of products) {
    if (product.priceHistory.length >= 2) {
      const current = product.priceHistory[0].price;
      const previous = product.priceHistory[1].price;
      
      let trend: string | null = null;
      if (current > previous) {
        trend = 'asc';
        ascCount++;
      } else if (current < previous) {
        trend = 'desc';
        descCount++;
      }

      if (trend) {
        await prisma.product.update({
          where: { id: product.id },
          data: { priceTrend: trend }
        });
        updatedCount++;
      }
    }
  }

  console.log(`✅ Migration complete!`);
  console.log(`Total updated: ${updatedCount}`);
  console.log(`📈 Hausse (asc): ${ascCount}`);
  console.log(`📉 Baisse (desc): ${descCount}`);
}

migrateTrends()
  .catch(console.error)
  .finally(() => { pool.end(); prisma.$disconnect(); });

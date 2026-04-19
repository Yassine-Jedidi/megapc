import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const p = await prisma.product.findMany({
    select: { title: true, price: true, salePrice: true },
    orderBy: { salePrice: 'desc' },
    take: 5
  });
  console.log(p);
}

main().catch(console.error).finally(() => { pool.end(); prisma.$disconnect(); });

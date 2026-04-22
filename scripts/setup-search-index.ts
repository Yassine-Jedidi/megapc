import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function setupSearch() {
  const client = await pool.connect();
  try {
    console.log("🚀 Enabling pg_trgm extension...");
    await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

    console.log("📈 Creating GIN Trigram index on Product.title...");
    // We use a GIN index with gin_trgm_ops for fast ILIKE and multi-word matching
    await client.query(`
      CREATE INDEX IF NOT EXISTS product_title_trgm_idx 
      ON "Product" USING gin (title gin_trgm_ops);
    `);

    console.log("📈 Creating GIN Trigram index on Product.cpu...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS product_cpu_trgm_idx 
      ON "Product" USING gin (cpu gin_trgm_ops);
    `);

    console.log("📈 Creating GIN Trigram index on Product.gpu...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS product_gpu_trgm_idx 
      ON "Product" USING gin (gpu gin_trgm_ops);
    `);

    console.log("✅ Search optimization complete!");
  } catch (error) {
    console.error("❌ Error setting up search index:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupSearch();

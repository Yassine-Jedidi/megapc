import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const indexes = [
  ['Product_slug_key', 'Product', 'slug'],
  ['Category_name_key', 'Category', 'name'],
  ['Category_slug_key', 'Category', 'slug'],
  ['Category_externalId_key', 'Category', 'externalId'],
] as const;

async function main() {
  for (const [index, table, column] of indexes) {
    const duplicates = await pool.query(
      `SELECT ${pg.escapeIdentifier(column)} AS value, COUNT(*)::int AS count
       FROM ${pg.escapeIdentifier(table)}
       WHERE ${pg.escapeIdentifier(column)} IS NOT NULL
       GROUP BY ${pg.escapeIdentifier(column)}
       HAVING COUNT(*) > 1
       LIMIT 5`,
    );

    if (duplicates.rowCount) {
      throw new Error(
        `Cannot create ${index}; duplicate ${table}.${column} values exist: ${JSON.stringify(duplicates.rows)}`,
      );
    }

    await pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ${pg.escapeIdentifier(index)} ` +
      `ON ${pg.escapeIdentifier(table)} (${pg.escapeIdentifier(column)})`,
    );
    console.log(`Ensured ${index}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

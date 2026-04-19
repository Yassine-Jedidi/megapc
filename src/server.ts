import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from 'hono/logger';

// Initialize Prisma with the PG Adapter for Hono/Bun speed
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

// 1. GET /api/products - Optimized with pagination and filters
app.get('/api/products', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const search = c.req.query('search') || '';
  const categoryId = c.req.query('categoryId');
  const onSale = c.req.query('onSale') === 'true';
  const isNew = c.req.query('isNew') === 'true';
  const inStock = c.req.query('inStock') === 'true';
  const minPrice = parseFloat(c.req.query('minPrice') || '0');
  const maxPrice = parseFloat(c.req.query('maxPrice') || '20000');
  const skip = (page - 1) * limit;

  const whereClause: Prisma.ProductWhereInput = {
    AND: [
      search ? { title: { contains: search, mode: 'insensitive' } } : {},
      categoryId ? { categoryId: categoryId } : {},
      onSale ? { onSale: true } : {},
      isNew ? { isNew: true } : {},
      inStock ? { stock: { gt: 0 } } : {},
      { price: { gte: minPrice, lte: maxPrice } }
    ]
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      orderBy: { siteCreateDate: 'desc' },
      include: { category: true }
    }),
    prisma.product.count({
      where: whereClause
    })
  ]);

  return c.json({
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// 2. GET /api/products/:slug - Deep details for a single product
app.get('/api/products/:slug', async (c) => {
  const slug = c.req.param('slug');
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      subCategory: true,
      priceHistory: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!product) return c.json({ error: 'Product not found' }, 404);
  return c.json(product);
});

// 3. GET /api/categories - All categories for navigation
app.get('/api/categories', async (c) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  });
  return c.json(categories);
});

// Start the Bun server
export default {
  port: 3001,
  fetch: app.fetch,
};

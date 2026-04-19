import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

// Initialize Prisma with the PG Adapter for Hono/Bun speed
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

// Production Image Proxy - Mimics the Vite proxy for Railway/Production
app.all('/api/images/*', async (c) => {
  const targetPath = c.req.path.replace(/^\/api\/images/, '');
  const targetUrl = `https://apibackend.megapc.tn${targetPath}`;
  
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://megapc.tn/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    // Cast status to ContentfulStatusCode (200, 404, etc.) as we are returning a body
    return c.body(buffer, response.status as ContentfulStatusCode, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // Cache images for 24 hours
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return c.text('Failed to fetch image', 500);
  }
});

// Centralized filtering logic for syncing counts across products and categories
const getSharedFilters = (c: Context): Prisma.ProductWhereInput => {
  const search = c.req.query('search') || '';
  const onSale = c.req.query('onSale') === 'true';
  const isNew = c.req.query('isNew') === 'true';
  const inStock = c.req.query('inStock') === 'true';
  const isArriving = c.req.query('isArriving') === 'true';
  const commande48H = c.req.query('commande48H') === 'true';
  const quoteMode = c.req.query('quoteMode') === 'true';
  const checkStock = c.req.query('checkStock') === 'true';
  const isPrivate = c.req.query('isPrivate') === 'true';
  const minPrice = parseFloat(c.req.query('minPrice') || '0');
  const maxPrice = parseFloat(c.req.query('maxPrice') || '20000');

  return {
    AND: [
      search ? { title: { contains: search, mode: 'insensitive' } } : {},
      onSale ? { OR: [{ onSale: true }, { salePrice: { not: null } }] } : {},
      isNew ? { isNew: true } : {},
      inStock ? { stock: { gt: 0 } } : {},
      isArriving ? { isArriving: true } : {},
      commande48H ? { commande48H: true } : {},
      quoteMode ? { quoteMode: true } : {},
      checkStock ? { checkStock: true } : {},
      isPrivate ? { isPrivate: true } : {},
      { price: { gte: minPrice, lte: maxPrice } }
    ]
  };
};

// 1. GET /api/products - Optimized with pagination and filters
app.get('/api/products', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const categoryId = c.req.query('categoryId');
  const subCategoryId = c.req.query('subCategoryId');
  const sortBy = c.req.query('sortBy') || 'newest';
  const skip = (page - 1) * limit;

  // Sorting map
  const orderByMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
    'newest': { siteCreateDate: 'desc' },
    'price-asc': { price: 'asc' },
    'price-desc': { price: 'desc' },
    'popular': { viewCount: 'desc' }
  };

  const sharedFilters = getSharedFilters(c);

  const whereClause: Prisma.ProductWhereInput = {
    AND: [
      sharedFilters,
      categoryId ? { categoryId: categoryId } : {},
      subCategoryId ? { subCategoryId: subCategoryId } : {}
    ]
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      orderBy: orderByMap[sortBy] || orderByMap.newest,
      omit: { rawData: true },
      include: { category: { select: { id: true, name: true } } }
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

// 2. GET /api/products/max-price - Get absolute max price for dynamic UI slider ceiling
app.get('/api/products/max-price', async (c) => {
  const aggr = await prisma.product.aggregate({
    _max: { price: true }
  });
  return c.json({ maxPrice: aggr._max.price || 20000 });
});

// 3. GET /api/products/:slug - Deep details for a single product
app.get('/api/products/:slug', async (c) => {
  const slug = c.req.param('slug');
  const product = await prisma.product.findUnique({
    where: { slug },
    omit: { rawData: true },
    include: {
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
      priceHistory: { orderBy: { createdAt: 'asc' } }
    }
  });

  if (!product) return c.json({ error: 'Product not found' }, 404);

  // Background increment view count (popular sort)
  prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } }
  }).catch(e => console.error('Failed to increment view count', e));

  return c.json(product);
});

// 3. GET /api/categories - All categories for navigation
app.get('/api/categories', async (c) => {
  const sharedFilters = getSharedFilters(c);

  const categories = await prisma.category.findMany({
    where: {
      products: { some: sharedFilters }
    },
    include: {
      _count: {
        select: { products: { where: sharedFilters } }
      }
    },
    orderBy: { name: 'asc' }
  });
  return c.json(categories);
});

// 4. GET /api/categories/:id/sub - Get sub-categories for a main category
app.get('/api/categories/:id/sub', async (c) => {
  const id = c.req.param('id');
  const sharedFilters = getSharedFilters(c);
  
  const categoryCounts = await prisma.product.groupBy({
    by: ['subCategoryId'],
    where: { 
      categoryId: id, 
      subCategoryId: { not: null },
      ...sharedFilters
    },
    _count: { subCategoryId: true }
  });

  const subCategoryIds = categoryCounts.map(c => c.subCategoryId).filter(Boolean) as string[];
  const subCategories = await prisma.category.findMany({
    where: { id: { in: subCategoryIds } },
    orderBy: { name: 'asc' }
  });

  const result = subCategories.map(sub => {
    const countData = categoryCounts.find(c => c.subCategoryId === sub.id);
    return {
      ...sub,
      _count: { products: countData?._count.subCategoryId || 0 }
    };
  });

  return c.json(result);
});

// Production Static Serving
// 1. Serve 'dist' contents (assets, etc.)
app.get('/*', serveStatic({ root: './dist' }));

// 2. SPA Fallback: Redirect all non-API paths to index.html for React Router
app.get('*', serveStatic({ path: './dist/index.html' }));

// Start the Bun server with dynamic port support for Railway
export default {
  port: process.env.PORT || 3001,
  hostname: '0.0.0.0', // Required for Railway/Docker to accept external traffic
  fetch: app.fetch,
};

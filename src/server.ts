import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import type { ContentfulStatusCode } from "hono/utils/http-status";

// Initialize Prisma
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

/**
 * 1. IMAGE PROXY ROUTE (Highest Priority)
 */
app.all("/api/images/*", async (c) => {
  const targetPath = c.req.path.replace(/^\/api\/images/, "");
  const w = c.req.query("w");
  const q = c.req.query("q");

  let targetUrl;
  if (w || q) {
    const fullImageUrl = `https://static.gi-ga.tech${targetPath}`;
    targetUrl = `https://www.megapc.tn/_next/image?url=${encodeURIComponent(fullImageUrl)}&w=${w || 1080}&q=${q || 75}`;
  } else {
    targetUrl = `https://apibackend.megapc.tn${targetPath}`;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.megapc.tn/",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
      },
    });

    if (!response.ok) {
      console.error(`Image proxy failed: ${response.status} for ${targetUrl}`);
      return c.text("Not found", 404);
    }

    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return c.body(buffer, response.status as ContentfulStatusCode, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=604800", // Cache images for 7 days
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return c.text("Internal Server Error", 500);
  }
});

// Centralized filtering logic for syncing counts across products and categories
const getSharedFilters = (c: Context): Prisma.ProductWhereInput => {
  const search = c.req.query("search") || "";
  const onSale = c.req.query("onSale") === "true";
  const isNew = c.req.query("isNew") === "true";
  const inStock = c.req.query("inStock") === "true";
  const isArriving = c.req.query("isArriving") === "true";
  const commande48H = c.req.query("commande48H") === "true";
  const quoteMode = c.req.query("quoteMode") === "true";
  const checkStock = c.req.query("checkStock") === "true";
  const isPrivate = c.req.query("isPrivate") === "true";
  const minPrice = parseFloat(c.req.query("minPrice") || "0");
  const maxPrice = parseFloat(c.req.query("maxPrice") || "25000");

  return {
    AND: [
      search ? { title: { contains: search, mode: "insensitive" } } : {},
      onSale ? { OR: [{ onSale: true }, { discount: { not: null } }] } : {},
      isNew ? { isNew: true } : {},
      inStock ? { stock: { gt: 0 } } : {},
      isArriving ? { isArriving: true } : {},
      commande48H ? { commande48H: true } : {},
      quoteMode ? { quoteMode: true } : {},
      checkStock ? { checkStock: true } : {},
      isPrivate ? { isPrivate: true } : {},
      { price: { gte: minPrice, lte: maxPrice } },
    ],
  };
};

// 1. GET /api/products - Optimized with pagination and filters
app.get("/api/products", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const categoryId = c.req.query("categoryId");
  const subCategoryId = c.req.query("subCategoryId");
  const sortBy = c.req.query("sortBy") || "newest";
  const skip = (page - 1) * limit;

  // Sorting map
  // NOTE: We sort by `price` for price-asc/desc (not salePrice) because salePrice
  // is null for non-promo items, which causes NULL rows to float to top in DESC.
  // The "effective price" column is always `price`; salePrice is only for display.
  const orderByMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
    newest: { siteCreateDate: { sort: "desc", nulls: "last" } },
    "price-asc": { price: { sort: "asc", nulls: "last" } },
    "price-desc": { price: { sort: "desc", nulls: "last" } },
    "discount-desc": { discount: { sort: "desc", nulls: "last" } },
    popular: { viewCount: "desc" },
  };

  const sharedFilters = getSharedFilters(c);
  const whereClause: Prisma.ProductWhereInput = {
    AND: [
      sharedFilters,
      categoryId ? { categoryId: categoryId } : {},
      subCategoryId ? { subCategoryId: subCategoryId } : {},
      sortBy === "discount-desc" ? { discount: { not: null } } : {},
    ],
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      orderBy: orderByMap[sortBy] || orderByMap.newest,
      omit: { rawData: true },
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  return c.json({
    products,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

app.get("/api/products/max-price", async (c) => {
  const aggr = await prisma.product.aggregate({ _max: { price: true } });
  return c.json({ maxPrice: aggr._max.price || 20000 });
});

app.get("/api/products/:slug", async (c) => {
  const slug = c.req.param("slug");
  const product = await prisma.product.findUnique({
    where: { slug },
    omit: { rawData: true },
    include: {
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
      priceHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!product) return c.json({ error: "Product not found" }, 404);

  prisma.product
    .update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  return c.json(product);
});

app.get("/api/categories", async (c) => {
  const sharedFilters = getSharedFilters(c);
  const categories = await prisma.category.findMany({
    where: { products: { some: sharedFilters } },
    include: { _count: { select: { products: { where: sharedFilters } } } },
    orderBy: { name: "asc" },
  });
  return c.json(categories);
});

app.get("/api/categories/:id/sub", async (c) => {
  const id = c.req.param("id");
  const sharedFilters = getSharedFilters(c);
  const subCategories = await prisma.category.findMany({
    where: {
      subProducts: { some: { AND: [{ categoryId: id }, sharedFilters] } },
    },
    include: {
      _count: {
        select: {
          subProducts: { where: { AND: [{ categoryId: id }, sharedFilters] } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return c.json(
    subCategories.map((sub) => ({
      ...sub,
      _count: { products: sub._count?.subProducts || 0 },
    })),
  );
});

/**
 * 3. STATIC FILES & SPA FALLBACK (Lowest Priority)
 */
app.use("/*", serveStatic({ root: "./dist" }));
app.get("*", serveStatic({ path: "./dist/index.html" }));

export default {
  port: process.env.PORT || 3001,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};

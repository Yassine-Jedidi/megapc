import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "hono/logger";
import type { ContentfulStatusCode } from "hono/utils/http-status";

// Initialize Prisma
// Strip channel_binding param — not supported by the pg driver (Neon-specific, causes silent failures)
const connectionString = process.env.DATABASE_URL?.replace(/[?&]channel_binding=[^&]*/g, (m) =>
  m.startsWith("?") ? "?" : ""
);
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Required for Neon / managed Postgres on Vercel
});
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
  const imageOrigin = process.env.IMAGE_ORIGIN || "https://apibackend.megapc.tn";

  let targetUrl;
  if (w || q) {
    const fullImageUrl = `${imageOrigin}${targetPath}`;
    targetUrl = `https://www.megapc.tn/_next/image?url=${encodeURIComponent(fullImageUrl)}&w=${w || 1080}&q=${q || 75}`;
  } else {
    targetUrl = `${imageOrigin}${targetPath}`;
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
      if (w || q) {
        const fallbackResponse = await fetch(`${imageOrigin}${targetPath}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Referer: "https://www.megapc.tn/",
            Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
          },
        });

        if (!fallbackResponse.ok) {
          return c.text("Not found", 404);
        }

        const fallbackContentType = fallbackResponse.headers.get("Content-Type") || "image/jpeg";
        const fallbackBuffer = await fallbackResponse.arrayBuffer();
        return c.body(fallbackBuffer, fallbackResponse.status as ContentfulStatusCode, {
          "Content-Type": fallbackContentType,
          "Cache-Control": "public, max-age=604800",
        });
      }

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
  const hasHistory = c.req.query("hasHistory") === "true";
  const minPrice = parseFloat(c.req.query("minPrice") || "0");
  const maxPrice = parseFloat(c.req.query("maxPrice") || "25000");
  const cpu = c.req.query("cpu");
  const gpu = c.req.query("gpu");
  const priceTrend = c.req.query("priceTrend");

  return {
    AND: [
      search ? {
        AND: search.trim().split(/\s+/).map(term => ({
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { cpu: { contains: term, mode: "insensitive" } },
            { gpu: { contains: term, mode: "insensitive" } }
          ]
        }))
      } : {},
      onSale ? { OR: [{ onSale: true }, { discount: { not: null } }] } : {},
      isNew ? { isNew: true } : {},
      inStock ? { stock: { gt: 0 } } : {},
      isArriving ? { isArriving: true } : {},
      commande48H ? { commande48H: true } : {},
      quoteMode ? { quoteMode: true } : {},
      checkStock ? { checkStock: true } : {},
      isPrivate ? { isPrivate: true } : {},
      hasHistory ? { hasHistory: true } : {},
      cpu ? (() => {
        const core = cpu.replace(/^(AMD\s+)?(Ryzen\s+|Intel\s+Core\s+Ultra\s+|Intel\s+Core\s+)/i, "").trim();
        const filters: Prisma.ProductWhereInput[] = [{ cpu: { contains: core, mode: "insensitive" } }];
        
        if (!/X$/i.test(core) && !/X3D/i.test(core)) {
          filters.push({ NOT: { cpu: { contains: `${core}X`, mode: "insensitive" } } });
        }
        if (!/X3D/i.test(core)) {
          filters.push({ NOT: { cpu: { contains: "X3D", mode: "insensitive" } } });
        }
        if (!/F$/i.test(core)) {
          filters.push({ NOT: { cpu: { contains: `${core}F`, mode: "insensitive" } } });
        }
        
        return { AND: filters };
      })() : {},
      gpu ? (() => {
        const core = gpu.replace(/^(Nvidia\s+)?(GeForce\s+|Radeon\s+|Intel\s+Arc\s+|Intel\s+)/i, "").trim();
        const filters: Prisma.ProductWhereInput[] = [{ gpu: { contains: core, mode: "insensitive" } }];
        
        if (!/Ti/i.test(core)) filters.push({ NOT: { gpu: { contains: "Ti", mode: "insensitive" } } });
        if (!/Super/i.test(core)) filters.push({ NOT: { gpu: { contains: "Super", mode: "insensitive" } } });
        if (!/XT/i.test(core)) filters.push({ NOT: { gpu: { contains: "XT", mode: "insensitive" } } });
        
        return { AND: filters };
      })() : {},
      { price: { gte: minPrice, lte: maxPrice } },
      priceTrend ? { priceTrend } : {},
    ],
  };
};

app.get("/api/products/specs", async (c) => {
  const categoryId = c.req.query("categoryId");
  const subCategoryId = c.req.query("subCategoryId");
  
  const where: Prisma.ProductWhereInput = {
    AND: [
      categoryId ? { categoryId } : {},
      subCategoryId ? { subCategoryId } : {},
    ]
  };

  const [cpus, gpus] = await Promise.all([
    prisma.product.findMany({
      where: { ...where, cpu: { not: null } },
      distinct: ["cpu"],
      select: { cpu: true },
      orderBy: { cpu: "asc" }
    }),
    prisma.product.findMany({
      where: { ...where, gpu: { not: null } },
      distinct: ["gpu"],
      select: { gpu: true },
      orderBy: { gpu: "asc" }
    }),
  ]);

  // API-Level Validation Allowlist + Formatting
  const isValidCpu = (val: string) => /^(Intel|AMD|Apple|Ryzen|Core\s*Ultra|Core\s*i[3579])\b/i.test(val);
  const isValidGpu = (val: string) => /^(Nvidia|GeForce|RTX|GTX|AMD|Radeon|RX|Arc|Apple)\b/i.test(val);

  const cleanCpus = [...new Set(
    cpus.map(c => c.cpu!)
        .filter(isValidCpu)
        .map(cpu => {
           const cleaned = cpu.replace(/^(?:Amd\s+Ryzen\b|Ryzen\b)/i, 'AMD Ryzen')
                            .replace(/^(?:Intel\s+Core\b|Core\b)/i, 'Intel Core')
                            .replace(/^(?:Intel\s+Ultra\b)/i, 'Intel Core Ultra')
                            .trim();
           
           // Match core CPU: Brand Line Model (e.g. Intel Core i5-12400F, AMD Ryzen 5 7600X)
           const match = cleaned.match(/^(Intel\s+Core\s+(?:Ultra\s+\d\s+|\w\d-)\w+|AMD\s+Ryzen\s+\d\s+\w+|Apple\s+M\d\s*(?:Pro|Max|Ultra)?)/i);
           if (match) {
              return match[1];
           }
           return cleaned.split(/\s(?:Box|Tray|WRAITH)/i)[0].trim();
        })
  )].sort();

  const cleanGpus = [...new Set(
    gpus.map(g => g.gpu!)
        .filter(isValidGpu)
        .map(gpu => {
          const cleaned = gpu.replace(/^(?:Nvidia\s+Geforce\b|Geforce\b|Nvidia\b)/i, '')
                           .replace(/^(?:Amd\s+Radeon\b|Radeon\b|Amd\b)/i, '')
                           .replace(/^(?:Intel\b)/i, '')
                           .trim();
          
          // Match the core GPU logic (e.g., RTX 5070 Ti, RX 7800 XT) ignoring all suffix fluff
          const match = cleaned.match(/^((?:RTX|GTX)\s+\d+(?:\s+(?:Ti(?:\s+Super)?|Super))?|RX\s+\d+(?:\s+(?:XT|XTX|GRE))?|Arc\s+(?:A|B)\d+)/i);
          
          if (match) {
            const core = match[1].replace(/\s+/g, ' ').trim().toUpperCase();
            if (core.startsWith('RTX') || core.startsWith('GTX')) return `GeForce ${core}`;
            if (core.startsWith('RX')) return `Radeon ${core}`;
            if (core.startsWith('ARC')) return `Intel Core ${core.replace('ARC', 'Arc')}`;
            return core;
          }
          
          // Fallback stripping for items that didn't perfectly match the above
          return gpu.replace(/\b(?:[123]x|Fan|Gddr[567]|Pcie\s+\d\.\d|Sff|Ice|Inspire|Shadow|Aero|Eagle|Prime|Triple|Verto|Epic|Plus|Bulk|White|Black|Max|Pro|O?12G(?:B|O)?|O?8G(?:B|O)?|O?16G(?:B|O)?|O?24G(?:B|O)?|O?32G(?:B|O)?)\b.*/gi, '').replace(/\s+/g, ' ').trim();
        })
  )].sort();

  return c.json({
    cpus: cleanCpus,
    gpus: cleanGpus
  });
});

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

export default app;

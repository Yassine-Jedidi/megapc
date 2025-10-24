const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit').default;
const { XMLParser } = require('fast-xml-parser');
const cheerio = require('cheerio');


// Just use __dirname directly (CommonJS provides it automatically)

// Configuration
const ORIGIN = 'https://megapc.tn';
const SITEMAP_URL = `${ORIGIN}/sitemap.xml`;
const OUT_DIR = path.resolve(__dirname, '..', 'data');
const PRODUCTS_DIR = path.join(OUT_DIR, 'products');
const CONCURRENCY = 4;
const REQUEST_DELAY_MS = 300; // polite delay between requests
const TIMEOUT_MS = 20000;

const http = axios.create({
  timeout: TIMEOUT_MS,
  headers: {
    'User-Agent': 'MegapcResearchBot/1.0 (+contact@example.com)',
    'Accept': 'text/html,application/json'
  },
  validateStatus: (s) => (s >= 200 && s < 300) || s === 304
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureDirs() {
  fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
}

function isProductUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.origin === ORIGIN &&
      /\/shop\/product\//.test(u.pathname) &&
      !u.pathname.endsWith('/cart')
    );
  } catch {
    return false;
  }
}

function extractSlugFromProductUrl(url) {
  const m = url.match(/\/shop\/product\/(.*?)(?:[\/?#]|$)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetchText(url) {
  const { data } = await http.get(url, { responseType: 'text' });
  return typeof data === 'string' ? data : String(data);
}

async function discoverBuildId() {
  const html = await fetchText(ORIGIN);
  const match = html.match(/"buildId"\s*:\s*"([^"]+)"/);
  if (!match) {
    // Fallback: try to parse from a script tag containing "_next/static/" reference
    const $ = cheerio.load(html);
    let buildId = null;
    $('script[src]')
      .toArray()
      .forEach((el) => {
        const src = $(el).attr('src') || '';
        const m = src.match(/\/_next\/static\/([^\/]+)\//);
        if (m && m[1]) buildId = m[1];
      });
    if (!buildId) throw new Error('Unable to find Next.js buildId');
    return buildId;
  }
  return match[1];
}

async function parseSitemapUrls(rootUrl) {
  const xml = await fetchText(rootUrl);
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);

  const urls = new Set();

  // If it's a sitemap index
  const indexEntries = doc?.sitemapindex?.sitemap;
  if (indexEntries) {
    const list = Array.isArray(indexEntries) ? indexEntries : [indexEntries];
    for (const entry of list) {
      const loc = entry?.loc;
      if (loc) {
        const childUrls = await parseSitemapUrls(loc);
        childUrls.forEach((u) => urls.add(u));
        await sleep(REQUEST_DELAY_MS);
      }
    }
    return Array.from(urls);
  }

  // Regular urlset
  const urlEntries = doc?.urlset?.url;
  if (urlEntries) {
    const list = Array.isArray(urlEntries) ? urlEntries : [urlEntries];
    for (const entry of list) {
      const loc = entry?.loc;
      if (typeof loc === 'string') urls.add(loc);
    }
  }
  return Array.from(urls);
}

async function getProductSlugsFromSitemap() {
  const allUrls = await parseSitemapUrls(SITEMAP_URL);
  const productUrls = allUrls.filter(isProductUrl);
  const slugs = Array.from(
    new Set(productUrls.map((u) => extractSlugFromProductUrl(u)).filter(Boolean))
  );
  return slugs;
}

async function fetchProductJson(buildId, slug) {
  const url = `${ORIGIN}/_next/data/${buildId}/shop/product/${encodeURIComponent(slug)}.json?lien=${encodeURIComponent(slug)}`;
  const { data } = await http.get(url, { headers: { 'x-nextjs-data': '1' } });
  return data;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function main() {
  await ensureDirs();

  console.log('Robots: Allowed overall, disallow only /uploads/ (per robots.txt).');

  console.log('Discovering Next.js buildId...');
  const buildId = await discoverBuildId();
  console.log('buildId:', buildId);

  console.log('Loading sitemap and extracting product slugs...');
  let slugs = await getProductSlugsFromSitemap();
  console.log(`Found ${slugs.length} product slugs from sitemap.`);
  
  const limit = pLimit(CONCURRENCY);
  let saved = 0;

  await Promise.all(
    slugs.map((slug) =>
      limit(async () => {
        const file = path.join(PRODUCTS_DIR, `${slug}.json`);
        try {
          await sleep(REQUEST_DELAY_MS);
          const full = await fetchProductJson(buildId, slug);
          const product = full?.pageProps?.product || full?.product || full;
          if (!product || typeof product !== 'object') return;
          writeJson(file, product);
          saved += 1;
          process.stdout.write(`Saved ${slug}\n`);
        } catch (e) {
          // skip item on error
        }
      })
    )
  );

  // Write index of slugs and a light index for the site to preload
  writeJson(path.join(OUT_DIR, 'data-index.json'), slugs);

  const light = [];
  for (const slug of slugs) {
    const file = path.join(PRODUCTS_DIR, `${slug}.json`);
    if (fs.existsSync(file)) {
      try {
        const p = JSON.parse(fs.readFileSync(file, 'utf8'));
        // Calculate discount percentage if prixEnPromo exists
        let discount = p.discount ?? null;
        if (p.prixEnPromo && p.price && p.price > p.prixEnPromo) {
          discount = ((p.price - p.prixEnPromo) / p.price) * 100;
        }

        light.push({
          slug,
          id: p._id || null,
          title: p.title || p.title_fr || slug,
          price: p.price ?? null,
          prixEnPromo: p.prixEnPromo ?? null,
          discount: discount,
          img: p?.images?.[0]?.thumbnailImageSrc || p?.gallerie?.urlPhoto?.[0] || null,
          category: p.categorie?.titre || 'Other',
          subcategory: p.filscateg?.titre || null
        });
      } catch {}
    }
  }
  writeJson(path.join(OUT_DIR, 'light-index.json'), light);

  console.log(`\nSaved ${saved}/${slugs.length} products to ${PRODUCTS_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


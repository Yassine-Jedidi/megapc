import app from "./app.js";
import { serveStatic } from "hono/bun";

/**
 * STATIC FILES & SPA FALLBACK (Lowest Priority)
 */
app.use("/*", serveStatic({ root: "./dist" }));
app.get("*", serveStatic({ path: "./dist/index.html" }));

export default {
  port: process.env.PORT || 3001,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};

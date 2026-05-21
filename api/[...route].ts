import { getRequestListener } from "@hono/node-server";
import app from "../src/app.js";

// pg and Prisma require Node.js — api/ directory defaults to Node.js runtime
export default getRequestListener(app.fetch);

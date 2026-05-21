import { handle } from "hono/vercel";
import app from "../src/app.js";

// pg and Prisma require Node.js — cannot run in Edge runtime
export const runtime = "nodejs";

export default handle(app);

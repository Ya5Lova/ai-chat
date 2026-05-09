import app from "@/lib/hono";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return app.fetch(req);
}

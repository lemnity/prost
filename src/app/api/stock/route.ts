import { ok } from "@/server/http";
import { liveByArticles } from "@/server/oasis";

/** Живые цены и остатки склада по артикулам: /api/stock?sku=a,b. */
export async function GET(req: Request) {
  const skus = (new URL(req.url).searchParams.get("sku") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const items = await liveByArticles(skus);
  return ok({ items }, { headers: { "Cache-Control": "public, max-age=60" } });
}

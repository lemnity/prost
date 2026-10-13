import { requireAdmin } from "@/server/admin";
import { fail, ok, readJson, str } from "@/server/http";
import { addNews, adminNews, deleteNews } from "@/server/site";
import { textToBlocks } from "@/lib/news-meta";

export async function GET() {
  const a = await requireAdmin();
  if (a instanceof Response) return a;
  return ok({ news: await adminNews() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return fail(400, "Некорректный запрос");
  const r = await addNews({
    title: str(body.title, 300),
    date: str(body.date, 10),
    excerpt: str(body.excerpt, 600),
    cover: str(body.cover),
    blocks: textToBlocks(str(body.text, 100_000)),
    topics: Array.isArray(body.topics) ? body.topics.map((t) => str(t, 20)) : [],
  });
  return "error" in r ? fail(400, r.error) : ok(r);
}

export async function DELETE(req: Request) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) return fail(400, "Некорректный запрос");
  await deleteNews(slug);
  return ok({ ok: true });
}

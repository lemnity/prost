import { requireAdmin } from "@/server/admin";
import { fail, ok, readJson, str } from "@/server/http";
import { addTopic, adminTopics, deleteTopic } from "@/server/site";

export async function GET() {
  const a = await requireAdmin();
  if (a instanceof Response) return a;
  return ok({ topics: await adminTopics() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return fail(400, "Некорректный запрос");
  const r = await addTopic(str(body.label, 100));
  return "error" in r ? fail(400, r.error) : ok(r);
}

export async function DELETE(req: Request) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!key) return fail(400, "Некорректный запрос");
  await deleteTopic(key);
  return ok({ ok: true });
}

import { exec, json, query, type Row } from "@/server/db";
import { requireAdmin } from "@/server/admin";
import { fail, ok, readJson } from "@/server/http";

export async function GET() {
  const a = await requireAdmin();
  if (a instanceof Response) return a;
  const rows = await query<Row & { id: number; kind: string; data: unknown; status: string; created_at: Date }>("SELECT * FROM leads ORDER BY id DESC LIMIT 300");
  return ok(
    { leads: rows.map((r) => ({ id: r.id, kind: r.kind, status: r.status, date: new Date(r.created_at).toISOString(), data: json<Record<string, string>>(r.data) })) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(req: Request) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const body = await readJson<{ id?: number; status?: string }>(req);
  if (!body?.id || !["new", "done"].includes(body.status ?? "")) return fail(400, "Некорректный запрос");
  await exec("UPDATE leads SET status = ? WHERE id = ?", [body.status, body.id]);
  return ok({ ok: true });
}

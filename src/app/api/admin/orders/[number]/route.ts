import { exec } from "@/server/db";
import { requireAdmin } from "@/server/admin";
import { fail, ok, readJson } from "@/server/http";
import { getOrderRow, toAdmin } from "@/server/orders";
import { listMessages } from "@/server/chat";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/orders/[number]">) {
  const a = await requireAdmin();
  if (a instanceof Response) return a;
  const { number } = await ctx.params;
  const row = await getOrderRow(number);
  if (!row) return fail(404, "Заявка не найдена");
  return ok({ order: toAdmin(row), messages: await listMessages(number), now: Date.now() }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/orders/[number]">) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const { number } = await ctx.params;
  const body = await readJson<{ status?: string }>(req);
  const status = ["new", "work", "done", "cancelled"].includes(body?.status ?? "") ? body!.status : null;
  if (!status) return fail(400, "Некорректный статус");
  await exec("UPDATE orders SET status = ? WHERE number = ?", [status, number]);
  return ok({ ok: true });
}

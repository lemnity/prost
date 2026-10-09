import { query, type Row } from "@/server/db";
import { requireAdmin } from "@/server/admin";
import { ok } from "@/server/http";
import { toAdmin, type OrderRow } from "@/server/orders";

/** Список заявок (фильтр ?status=new|done|cancelled). */
export async function GET(req: Request) {
  const a = await requireAdmin();
  if (a instanceof Response) return a;
  const status = new URL(req.url).searchParams.get("status");
  const rows = status
    ? await query<OrderRow & Row>("SELECT * FROM orders WHERE status = ? ORDER BY id DESC LIMIT 300", [status])
    : await query<OrderRow & Row>("SELECT * FROM orders ORDER BY id DESC LIMIT 300");
  const unread = await query<Row & { order_number: string; n: number }>(
    `SELECT m.order_number, COUNT(*) AS n FROM messages m
     WHERE m.role = 'user' AND m.id > COALESCE((SELECT MAX(id) FROM messages x WHERE x.order_number = m.order_number AND x.role = 'manager'), 0)
     GROUP BY m.order_number`,
  );
  const map = new Map(unread.map((u) => [u.order_number, Number(u.n)]));
  return ok({ orders: rows.map((r) => ({ ...toAdmin(r), unanswered: map.get(r.number) ?? 0 })) }, { headers: { "Cache-Control": "no-store" } });
}

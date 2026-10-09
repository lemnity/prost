import { query, type Row } from "@/server/db";
import { requireAdmin } from "@/server/admin";
import { ok } from "@/server/http";
import { toUser } from "@/server/auth";

export async function GET() {
  const a = await requireAdmin();
  if (a instanceof Response) return a;
  const rows = await query<Row & { id: number; email: string; role: "user" | "admin"; profile: unknown; created_at: Date; password_hash: string; orders: number }>(
    "SELECT u.*, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders FROM users u ORDER BY u.id DESC LIMIT 500",
  );
  return ok({ users: rows.map((r) => ({ ...toUser(r), orders: Number(r.orders) })) }, { headers: { "Cache-Control": "no-store" } });
}

import { randomBytes } from "node:crypto";
import { exec, query, type Row } from "@/server/db";
import { requireAdmin } from "@/server/admin";
import { fail, ok, readJson } from "@/server/http";
import { hashPassword, toUser } from "@/server/auth";

export async function GET() {
  const a = await requireAdmin();
  if (a instanceof Response) return a;
  const rows = await query<Row & { id: number; email: string; role: "user" | "admin"; profile: unknown; created_at: Date; password_hash: string; email_verified_at: Date | null; orders: number }>(
    "SELECT u.*, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders FROM users u ORDER BY u.id DESC LIMIT 500",
  );
  return ok({ users: rows.map((r) => ({ ...toUser(r), orders: Number(r.orders) })) }, { headers: { "Cache-Control": "no-store" } });
}

/** Новый пароль клиенту (показывается менеджеру один раз, сессии клиента закрываются). */
export async function PATCH(req: Request) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const body = await readJson<{ id?: number }>(req);
  const [u] = body?.id ? await query<Row & { id: number; role: string }>("SELECT id, role FROM users WHERE id = ?", [body.id]) : [];
  if (!u) return fail(404, "Пользователь не найден");
  if (u.role === "admin") return fail(403, "Пароль администратора меняется только им самим");
  const password = randomBytes(9).toString("base64url");
  await exec("UPDATE users SET password_hash = ? WHERE id = ?", [await hashPassword(password), u.id]);
  await exec("DELETE FROM sessions WHERE user_id = ?", [u.id]);
  return ok({ password });
}

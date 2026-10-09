import { exec, query, type Row } from "@/server/db";
import { currentUser, hashPassword, tooManyAttempts, verifyPassword } from "@/server/auth";
import { fail, ok, readJson, sameOrigin } from "@/server/http";

export async function POST(req: Request) {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  const user = await currentUser();
  if (!user) return fail(401, "Войдите в кабинет");
  const body = await readJson<{ current?: string; next?: string }>(req);
  const next = body?.next ?? "";
  if (next.length < 8 || next.length > 200) return fail(400, "Минимум 8 символов", { field: "next" });
  if (tooManyAttempts(`pw:${user.id}`)) return fail(429, "Слишком много попыток, попробуйте позже", { field: "current" });
  const [row] = await query<Row & { password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", [user.id]);
  if (!row || !(await verifyPassword(body?.current ?? "", row.password_hash))) return fail(400, "Текущий пароль указан неверно", { field: "current" });
  await exec("UPDATE users SET password_hash = ? WHERE id = ?", [await hashPassword(next), user.id]);
  return ok({ ok: true });
}

import { findUserByEmail, startSession, toUser, tooManyAttempts, verifyPassword } from "@/server/auth";
import { clientIp, fail, ok, readJson, sameOrigin, str } from "@/server/http";
import { mePayload } from "@/server/me";

export async function POST(req: Request) {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  const body = await readJson<Record<string, unknown>>(req);
  const email = str(body?.email, 190).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  if (tooManyAttempts(`login:${await clientIp()}:${email}`)) return fail(429, "Слишком много попыток, попробуйте через 10 минут", { field: "password" });
  const row = email ? await findUserByEmail(email) : null;
  if (!row) return fail(401, "Кабинет с таким email не найден", { field: "email" });
  if (!(await verifyPassword(password, row.password_hash))) return fail(401, "Неверный пароль", { field: "password" });
  await startSession(row.id);
  return ok(await mePayload(toUser(row)));
}

import { exec } from "@/server/db";
import { findUserByEmail, hashPassword, startSession, tooManyAttempts } from "@/server/auth";
import { clientIp, fail, ok, readJson, sameOrigin, str } from "@/server/http";
import { EMAIL, cleanProfile } from "@/server/profile";
import { mePayload } from "@/server/me";

export async function POST(req: Request) {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return fail(400, "Некорректный запрос");
  const email = str(body.email, 190).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!EMAIL.test(email)) return fail(400, "Проверьте адрес электронной почты", { field: "email" });
  if (password.length < 8 || password.length > 200) return fail(400, "Минимум 8 символов", { field: "password" });
  if (tooManyAttempts(`reg:${await clientIp()}`)) return fail(429, "Слишком много попыток, попробуйте позже");
  const res = cleanProfile(body, email);
  if ("error" in res) return fail(400, res.error, { field: res.field });
  if (await findUserByEmail(email)) return fail(409, "Кабинет с таким email уже есть — войдите", { field: "email" });
  const profile = { ...res.profile, ...(res.profile.marketing ? { marketingAt: new Date().toISOString() } : {}) };
  const r = await exec("INSERT INTO users (email, password_hash, profile) VALUES (?, ?, ?)", [email, await hashPassword(password), JSON.stringify(profile)]);
  await startSession(r.insertId);
  return ok(await mePayload());
}

import { exec, query, type Row } from "@/server/db";
import { currentUser, sha256, tooManyAttempts } from "@/server/auth";
import { fail, ok, sameOrigin } from "@/server/http";
import { sendVerification } from "@/server/verify";

const site = () => process.env.SITE_URL || "https://prostyle.agency";

/** Переход по ссылке из письма: подтверждаем почту и возвращаем в кабинет. */
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("token") ?? "";
  const [row] = t
    ? await query<Row & { user_id: number }>("SELECT user_id FROM email_tokens WHERE token_hash = ? AND kind = 'verify' AND expires_at > UTC_TIMESTAMP()", [sha256(t)])
    : [];
  if (!row) return Response.redirect(`${site()}/account?verified=0`, 303);
  await exec("UPDATE users SET email_verified_at = UTC_TIMESTAMP() WHERE id = ?", [row.user_id]);
  await exec("DELETE FROM email_tokens WHERE user_id = ? AND kind = 'verify'", [row.user_id]);
  return Response.redirect(`${site()}/account?verified=1`, 303);
}

/** Отправить письмо подтверждения ещё раз. */
export async function POST() {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  const user = await currentUser();
  if (!user) return fail(401, "Войдите в кабинет");
  if (user.emailVerified) return ok({ ok: true, already: true });
  if (tooManyAttempts(`verify:${user.id}`) ) return fail(429, "Письмо уже отправлено, попробуйте через 10 минут");
  const sent = await sendVerification(user);
  return sent ? ok({ ok: true }) : fail(503, "Не удалось отправить письмо, попробуйте позже");
}

import { exec } from "@/server/db";
import { currentUser } from "@/server/auth";
import { fail, ok, readJson, sameOrigin } from "@/server/http";
import { cleanDelivery, cleanProfile } from "@/server/profile";
import { mePayload } from "@/server/me";

export async function GET() {
  return ok(await mePayload(), { headers: { "Cache-Control": "no-store" } });
}

/** Обновление профиля ({ profile }) и/или настроек доставки ({ delivery }). */
export async function PATCH(req: Request) {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  const user = await currentUser();
  if (!user) return fail(401, "Войдите в кабинет");
  const body = await readJson<{ profile?: Record<string, unknown>; delivery?: unknown }>(req);
  if (!body) return fail(400, "Некорректный запрос");
  let profile = { ...user.profile };
  if (body.profile) {
    const res = cleanProfile({ ...user.profile, ...body.profile }, user.email);
    if ("error" in res) return fail(400, res.error, { field: res.field });
    const wasOn = !!user.profile.marketing;
    profile = {
      ...profile,
      ...res.profile,
      marketingAt: res.profile.marketing ? (wasOn ? user.profile.marketingAt : new Date().toISOString()) : undefined,
    };
  }
  if (body.delivery !== undefined) {
    const d = cleanDelivery(body.delivery);
    if (d) profile.delivery = d;
  }
  await exec("UPDATE users SET profile = ? WHERE id = ?", [JSON.stringify(profile), user.id]);
  return ok(await mePayload({ ...user, profile }));
}

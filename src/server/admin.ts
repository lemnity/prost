import { currentUser, type DbUser } from "./auth";
import { fail, sameOrigin } from "./http";

/** Админ или ответ с ошибкой. */
export async function requireAdmin(mutating = false): Promise<DbUser | Response> {
  if (mutating && !(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  const u = await currentUser();
  if (!u) return fail(401, "Войдите");
  if (u.role !== "admin") return fail(403, "Нет доступа");
  return u;
}

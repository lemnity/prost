import { revalidatePath } from "next/cache";
import { fail, ok } from "@/server/http";
import { syncTokenOk } from "@/server/sync-token";

/**
 * Обновить статические страницы с данными склада (главная: «Новинки»). Вызывает деплой сразу после запуска:
 * при сборке базы нет, и без этого главная до часа показывала бы запасной список.
 */
export async function POST() {
  if (!(await syncTokenOk())) return fail(403, "Нет доступа");
  revalidatePath("/");
  return ok({ ok: true });
}

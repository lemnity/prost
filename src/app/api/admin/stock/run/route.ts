import { after } from "next/server";
import { requireAdmin } from "@/server/admin";
import { fail, ok, readJson, sameOrigin } from "@/server/http";
import { syncOasis, syncOasisCatalog, syncOasisSection } from "@/server/oasis";
import { syncGifts, syncGiftsCatalog } from "@/server/gifts";

type Kind = "oasis-stock" | "oasis-catalog" | "gifts-stock" | "gifts-catalog" | "section";

/**
 * Ручной запуск синхронизации из админки. Работа идёт в фоне (полный каталог — несколько минут, а nginx ждёт 60 с),
 * ход выполнения админка читает из /api/admin/stock (журнал sync_log).
 */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const body = await readJson<{ kind?: Kind; category?: number }>(req);
  const category = Number(body?.category) || 0;
  const jobs: Record<Kind, (() => Promise<unknown>) | null> = {
    "oasis-stock": syncOasis,
    "oasis-catalog": syncOasisCatalog,
    "gifts-stock": syncGifts,
    "gifts-catalog": syncGiftsCatalog,
    section: category > 0 ? () => syncOasisSection(category) : null,
  };
  const job = body?.kind ? jobs[body.kind] : null;
  if (!job) return fail(400, "Не выбрано, что обновлять");
  after(async () => {
    try {
      await job();
    } catch (e) {
      console.error(`stock ${body?.kind}:`, (e as Error).message);
    }
  });
  return ok({ started: true });
}

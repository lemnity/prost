import { fail, ok } from "@/server/http";
import { requireAdmin } from "@/server/admin";
import { syncOasis, syncOasisCatalog } from "@/server/oasis";
import { syncGifts, syncGiftsCatalog } from "@/server/gifts";
import { syncTokenOk } from "@/server/sync-token";

/**
 * Запуск синхронизации склада: таймер на сервере (заголовок X-Sync-Token) или админ из админки.
 * ?supplier=gifts — склад gifts.ru (по умолчанию Oasis); ?kind=catalog — каталог целиком, иначе цены и остатки.
 */
export async function POST(req: Request) {
  if (!(await syncTokenOk())) {
    const a = await requireAdmin(true);
    if (a instanceof Response) return a;
  }
  try {
    const q = new URL(req.url).searchParams;
    const full = q.get("kind") === "catalog";
    const gifts = q.get("supplier") === "gifts";
    const r = gifts ? await (full ? syncGiftsCatalog() : syncGifts()) : await (full ? syncOasisCatalog() : syncOasis());
    return ok({ ok: true, ...r });
  } catch (e) {
    return fail(502, (e as Error).message);
  }
}

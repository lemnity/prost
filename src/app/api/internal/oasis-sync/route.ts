import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { fail, ok } from "@/server/http";
import { requireAdmin } from "@/server/admin";
import { syncOasis, syncOasisCatalog } from "@/server/oasis";
import { syncGifts, syncGiftsCatalog } from "@/server/gifts";

const tokenOk = (t: string | null) => {
  const want = process.env.OASIS_SYNC_TOKEN;
  if (!want || !t) return false;
  const a = Buffer.from(want), b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Запуск синхронизации склада: таймер на сервере (заголовок X-Sync-Token) или админ из админки.
 * ?supplier=gifts — склад gifts.ru (по умолчанию Oasis); ?kind=catalog — каталог целиком, иначе цены и остатки.
 */
export async function POST(req: Request) {
  if (!tokenOk((await headers()).get("x-sync-token"))) {
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

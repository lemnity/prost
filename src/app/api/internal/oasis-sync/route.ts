import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { fail, ok } from "@/server/http";
import { requireAdmin } from "@/server/admin";
import { syncOasis } from "@/server/oasis";

const tokenOk = (t: string | null) => {
  const want = process.env.OASIS_SYNC_TOKEN;
  if (!want || !t) return false;
  const a = Buffer.from(want), b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
};

/** Запуск синхронизации склада: таймер на сервере (заголовок X-Sync-Token) или админ из админки. */
export async function POST() {
  if (!tokenOk((await headers()).get("x-sync-token"))) {
    const a = await requireAdmin(true);
    if (a instanceof Response) return a;
  }
  try {
    const r = await syncOasis();
    return ok({ ok: true, ...r });
  } catch (e) {
    return fail(502, (e as Error).message);
  }
}

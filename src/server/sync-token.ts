import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";

/** Служебные вызовы с сервера (таймеры, деплой): заголовок X-Sync-Token = OASIS_SYNC_TOKEN из .env. */
export async function syncTokenOk(): Promise<boolean> {
  const want = process.env.OASIS_SYNC_TOKEN;
  const t = (await headers()).get("x-sync-token");
  if (!want || !t) return false;
  const a = Buffer.from(want), b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
}

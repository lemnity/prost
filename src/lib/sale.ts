// Распродажа недели — до воскресенья 23:59:59 Asia/Yekaterinburg (+05:00, без DST).
const OFFSET_MS = 5 * 3600_000;
const DAY = 86_400_000;

/** Конец текущей недели; ровно в 23:59:59 вс переходит на следующую неделю. */
export function getSaleEndsAt(now: Date): Date {
  const local = new Date(now.getTime() + OFFSET_MS);
  const toSunday = (7 - local.getUTCDay()) % 7;
  const nextMidnight =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + toSunday + 1) -
    OFFSET_MS;
  let end = nextMidnight - 1000;
  if (end <= now.getTime()) end += 7 * DAY;
  return new Date(end);
}

export type SaleRemaining = { days: number; hours: number; minutes: number; seconds: number };

export function getSaleRemaining(now: Date): SaleRemaining {
  const total = Math.max(
    0,
    Math.floor((getSaleEndsAt(now).getTime() - now.getTime()) / 1000),
  );
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

// Чистые функции дат. Часовой пояс заказчика — Тюмень (Asia/Yekaterinburg, UTC+5, без DST).
const TZ = "Asia/Yekaterinburg";
const OFFSET_MS = 5 * 3600_000;
const MIN = 60_000;

/** Сдвигает момент так, что UTC-геттеры дают локальное (тюменское) время. */
function toLocal(d: Date): Date {
  return new Date(d.getTime() + OFFSET_MS);
}

/** Момент локальной полуночи (+05:00) для заданных y/m(0-11)/d. */
function localMidnight(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d) - OFFSET_MS);
}

export function getNewYearCountdown(now: Date): {
  days: number;
  hours: number;
  minutes: number;
} {
  const year = toLocal(now).getUTCFullYear();
  const target = localMidnight(year + 1, 0, 1);
  const total = Math.max(
    0,
    Math.floor((target.getTime() - now.getTime()) / MIN),
  );
  return {
    days: Math.floor(total / 1440),
    hours: Math.floor((total % 1440) / 60),
    minutes: total % 60,
  };
}

type Rule =
  | { title: string; month: number; day: number }
  | { title: string; month: number; sunday: number };

// month: 0-11. Порядок — по году.
const HOLIDAYS: Rule[] = [
  { title: "День святого Валентина", month: 1, day: 14 },
  { title: "День защитника Отечества", month: 1, day: 23 },
  { title: "Международный женский день", month: 2, day: 8 },
  { title: "Праздник весны и труда", month: 4, day: 1 },
  { title: "День Победы", month: 4, day: 9 },
  { title: "День России", month: 5, day: 12 },
  { title: "День медицинского работника", month: 5, sunday: 3 },
  { title: "День строителя", month: 7, sunday: 2 },
  { title: "День знаний", month: 8, day: 1 },
  { title: "Хэллоуин", month: 9, day: 31 },
  { title: "День народного единства", month: 10, day: 4 },
];

function resolveDay(rule: Rule, year: number): number {
  if ("day" in rule) return rule.day;
  const firstDow = new Date(Date.UTC(year, rule.month, 1)).getUTCDay();
  const firstSunday = 1 + ((7 - firstDow) % 7);
  return firstSunday + (rule.sunday - 1) * 7;
}

const shortFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  timeZone: TZ,
});

export type UpcomingHoliday = { title: string; date: string };

/** Ближайшие `count` праздников по календарю; date — короткая дата («31 окт»). */
export function getUpcomingHolidays(
  now: Date,
  count: number,
): UpcomingHoliday[] {
  const local = toLocal(now);
  const year = local.getUTCFullYear();
  const today = Date.UTC(year, local.getUTCMonth(), local.getUTCDate());
  const found: { title: string; at: number; date: Date }[] = [];
  for (const y of [year, year + 1]) {
    for (const rule of HOLIDAYS) {
      const day = resolveDay(rule, y);
      const at = Date.UTC(y, rule.month, day);
      if (at < today) continue;
      found.push({
        title: rule.title,
        at,
        date: localMidnight(y, rule.month, day),
      });
    }
  }
  found.sort((a, b) => a.at - b.at);
  return found.slice(0, count).map(({ title, date }) => ({
    title,
    date: shortFmt.format(date).replace(/\.$/, ""),
  }));
}

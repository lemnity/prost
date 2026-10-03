"use client";

import { useEffect, useState } from "react";
import { getNewYearCountdown } from "@/lib/holidays";

const plural = new Intl.PluralRules("ru");
const FORMS: Record<"d" | "h" | "m", Record<string, string>> = {
  d: { one: "день", few: "дня", many: "дней", other: "дня" },
  h: { one: "час", few: "часа", many: "часов", other: "часа" },
  m: { one: "минута", few: "минуты", many: "минут", other: "минуты" },
};

function word(kind: keyof typeof FORMS, n: number) {
  return `${n} ${FORMS[kind][plural.select(n)] ?? FORMS[kind].other}`;
}

type Countdown = ReturnType<typeof getNewYearCountdown>;

export function NewYearCountdown({ initial }: { initial: Countdown }) {
  // Первый клиентский рендер == серверный (initial посчитан при сборке);
  // реальное значение ставится в useEffect, чтобы React обновил DOM.
  const [c, setC] = useState<Countdown>(initial);

  useEffect(() => {
    const tick = () => setC(getNewYearCountdown(new Date()));
    let id: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      tick();
      id ??= setInterval(tick, 30_000);
    };
    const stop = () => {
      if (id !== undefined) clearInterval(id);
      id = undefined;
    };
    const onVis = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div
      role="group"
      aria-label={`До Нового года ${word("d", c.days)} ${word("h", c.hours)} ${word("m", c.minutes)}`}
      className="pointer-events-none absolute left-2 top-2 z-10 rounded-[8px] bg-brand px-2.5 py-1.5 text-white"
    >
      <div aria-hidden="true">
        <div className="text-[11px] leading-tight">До Нового года</div>
        <div
          className="whitespace-nowrap text-sm font-bold leading-tight tabular-nums"
        >
          {`${c.days} д ${c.hours} ч ${c.minutes} мин`}
        </div>
      </div>
    </div>
  );
}

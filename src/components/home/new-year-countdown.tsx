"use client";

import { useEffect, useState } from "react";
import { getNewYearCountdown } from "@/lib/holidays";

const rules = new Intl.PluralRules("ru");
const FORMS: Record<"d" | "h" | "m", Record<string, string>> = {
  d: { one: "день", few: "дня", many: "дней", other: "дня" },
  h: { one: "час", few: "часа", many: "часов", other: "часа" },
  m: { one: "минута", few: "минуты", many: "минут", other: "минуты" },
};

function plural(unit: keyof typeof FORMS, n: number): string {
  return FORMS[unit][rules.select(n)] ?? FORMS[unit].other;
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

  const cells = [
    { n: String(c.days), label: plural("d", c.days) },
    {
      n: String(c.hours).padStart(2, "0"),
      label: plural("h", c.hours),
    },
    {
      n: String(c.minutes).padStart(2, "0"),
      label: plural("m", c.minutes),
    },
  ];

  return (
    <div
      role="group"
      aria-label={`До Нового года ${c.days} ${plural("d", c.days)} ${c.hours} ${plural("h", c.hours)} ${c.minutes} ${plural("m", c.minutes)}`}
    >
      <div aria-hidden="true">
        <div className="text-xs leading-tight text-muted">
          До Нового года осталось
        </div>
        <div className="mt-1.5 flex gap-2 xl:mt-2">
          {cells.map((x, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="min-w-[46px] rounded-[10px] bg-white px-1.5 py-1.5 text-center text-[22px] font-bold leading-none tabular-nums text-brand xl:min-w-[56px] xl:px-3 xl:py-2 xl:text-[28px]">
                {x.n}
              </div>
              <div className="text-[11px] leading-tight text-muted">
                {x.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

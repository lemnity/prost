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

  const cells = [
    { n: String(c.days), label: word("d", c.days).split(" ")[1] },
    {
      n: String(c.hours).padStart(2, "0"),
      label: word("h", c.hours).split(" ")[1],
    },
    {
      n: String(c.minutes).padStart(2, "0"),
      label: word("m", c.minutes).split(" ")[1],
    },
  ];

  return (
    <div
      role="group"
      aria-label={`До Нового года ${word("d", c.days)} ${word("h", c.hours)} ${word("m", c.minutes)}`}
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

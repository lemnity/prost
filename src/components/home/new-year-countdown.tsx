"use client";

import { useEffect, useState } from "react";
import { getNewYearCountdown } from "@/lib/holidays";
import { plural } from "@/lib/plural";

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
      id ??= setInterval(tick, 1000);
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
    {
      n: String(c.seconds).padStart(2, "0"),
      label: plural("s", c.seconds),
      tick: true,
    },
  ];

  const label = `До Нового года ${c.days} ${plural("d", c.days)} ${c.hours} ${plural("h", c.hours)} ${c.minutes} ${plural("m", c.minutes)}`;

  return (
    <div role="group" aria-label={label}>
      <div aria-hidden="true">
        <div className="text-[12px] font-semibold leading-tight text-brand xl:text-[13px]">
          Поторопитесь! До Нового года осталось
        </div>
        <div className="mt-1.5 flex gap-1 xl:mt-2 xl:gap-1.5">
          {cells.map((x, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div
                key={x.tick ? x.n : undefined}
                className={`min-w-[38px] rounded-[10px] bg-white px-1 py-1.5 text-center text-[22px] font-bold leading-none tabular-nums text-brand ring-1 ring-[#CFE3F2] xl:min-w-[50px] xl:px-2 xl:py-2 xl:text-[28px] ${x.tick ? "ny-tick" : ""}`}
              >
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

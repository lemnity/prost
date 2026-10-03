"use client";

import { useEffect, useState } from "react";
import { getSaleRemaining, type SaleRemaining } from "@/lib/sale";
import { plural } from "@/lib/plural";

export function SaleCountdown({ initial }: { initial: SaleRemaining }) {
  // Первый клиентский рендер == серверный (initial из сборки);
  // реальное значение — в useEffect. По достижении 0 getSaleRemaining
  // сам переходит на следующую неделю.
  const [c, setC] = useState<SaleRemaining>(initial);

  useEffect(() => {
    const tick = () => setC(getSaleRemaining(new Date()));
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

  const pad = (n: number) => String(n).padStart(2, "0");
  const cells = [
    { n: String(c.days), label: "дн" },
    { n: pad(c.hours), label: "ч" },
    { n: pad(c.minutes), label: "мин" },
    { n: pad(c.seconds), label: "сек" },
  ];

  return (
    <div
      role="group"
      aria-label={`До конца распродажи ${c.days} ${plural("d", c.days)} ${c.hours} ${plural("h", c.hours)} ${c.minutes} ${plural("m", c.minutes)}`}
    >
      <div aria-hidden="true" className="flex items-center gap-3">
        <div className="text-xs text-muted">До конца распродажи</div>
        <div className="flex items-start gap-1">
          {cells.map((x, i) => (
            <div key={x.label} className="flex items-start gap-1">
              {i > 0 ? (
                <span className="py-1 text-base font-bold leading-none text-ink">:</span>
              ) : null}
              <div className="flex flex-col items-center gap-0.5">
                <div className="min-w-[34px] rounded-[6px] bg-ink px-2 py-1 text-center text-base font-bold leading-none tabular-nums text-white">
                  {x.n}
                </div>
                <div className="text-[10px] leading-tight text-muted">{x.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

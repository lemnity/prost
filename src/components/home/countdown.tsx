"use client";

import { useEffect, useState } from "react";
import {
  getSaleRemaining,
  type SaleRemaining,
  type SaleTarget,
} from "@/lib/sale";
import { plural } from "@/lib/plural";

export function Countdown({
  initial,
  target = "week",
}: {
  initial: SaleRemaining;
  target?: SaleTarget;
}) {
  // Первый клиентский рендер == серверный (initial из сборки);
  // реальное значение — в useEffect. По достижении 0 getSaleRemaining
  // сам переходит на следующий период.
  const [c, setC] = useState<SaleRemaining>(initial);

  useEffect(() => {
    const tick = () => setC(getSaleRemaining(new Date(), target));
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
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (target === "day") {
    const hm = `${c.hours} ${plural("h", c.hours)} ${c.minutes} ${plural("m", c.minutes)}`;
    return (
      <div role="group" aria-label={`До конца предложения ${hm}`}>
        <div aria-hidden="true" className="flex items-center gap-2">
          <span className="text-[11px] leading-tight text-muted">
            До конца предложения
          </span>
          <span className="flex items-center gap-0.5 text-[13px] font-bold leading-none text-ink">
            {[pad(c.hours), pad(c.minutes), pad(c.seconds)].map((n, i) => (
              <span key={i} className="flex items-center gap-0.5">
                {i > 0 ? ":" : null}
                <span className="rounded-[6px] bg-ink px-1.5 py-0.5 tabular-nums text-white">
                  {n}
                </span>
              </span>
            ))}
          </span>
        </div>
      </div>
    );
  }

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
                <span className="py-1 text-base font-bold leading-none text-ink">
                  :
                </span>
              ) : null}
              <div className="flex flex-col items-center gap-0.5">
                <div className="min-w-[34px] rounded-[6px] bg-ink px-2 py-1 text-center text-base font-bold leading-none tabular-nums text-white">
                  {x.n}
                </div>
                <div className="text-[10px] leading-tight text-muted">
                  {x.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

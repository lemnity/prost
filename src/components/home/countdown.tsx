"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Clock } from "lucide-react";
import {
  getSaleRemaining,
  type SaleRemaining,
  type SaleTarget,
} from "@/lib/sale";
import {
  getTickerServerSnapshot,
  getTickerSnapshot,
  subscribeTicker,
} from "@/lib/ticker";
import { plural } from "@/lib/plural";

export function Countdown({
  initial,
  target = "week",
}: {
  initial: SaleRemaining;
  target?: SaleTarget;
}) {
  // Серверный/первый клиентский рендер == initial (из сборки); дальше —
  // общий тикер. Таймер в скрытой панели (display:none) не подписывается.
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(target !== "day");
  useEffect(() => {
    const el = ref.current;
    if (target !== "day" || !el) return;
    const io = new IntersectionObserver(([e]) => setShown(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  const subscribe = useMemo(
    () => (shown ? subscribeTicker : () => () => {}),
    [shown],
  );
  const t = useSyncExternalStore(
    subscribe,
    getTickerSnapshot,
    getTickerServerSnapshot,
  );
  const c = useMemo(
    () => (t ? getSaleRemaining(new Date(t * 1000), target) : initial),
    [t, target, initial],
  );

  const pad = (n: number) => String(n).padStart(2, "0");

  if (target === "day") {
    const hm = `${c.hours} ${plural("h", c.hours)} ${c.minutes} ${plural("m", c.minutes)}`;
    return (
      <div
        ref={ref}
        role="group"
        aria-label={`До конца предложения ${hm}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[12px] font-bold leading-none tabular-nums text-white"
      >
        <Clock size={12} aria-hidden />
        <span aria-hidden="true">
          {pad(c.hours)}:{pad(c.minutes)}:{pad(c.seconds)}
        </span>
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
      ref={ref}
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

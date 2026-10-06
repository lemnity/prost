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
  compact = false,
  large = false,
}: {
  initial: SaleRemaining;
  target?: SaleTarget;
  /** Компактная «таблетка» вместо ячеек (для карточки товара). */
  compact?: boolean;
  /** Крупные ячейки (баннер страницы распродажи). */
  large?: boolean;
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

  if (target === "day" || compact) {
    const hm = `${c.days ? `${c.days} ${plural("d", c.days)} ` : ""}${c.hours} ${plural("h", c.hours)} ${c.minutes} ${plural("m", c.minutes)}`;
    return (
      <div
        ref={ref}
        role="group"
        aria-label={`До конца предложения ${hm}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[12px] font-bold leading-none tabular-nums text-white"
      >
        <Clock size={12} aria-hidden />
        <span aria-hidden="true">
          {c.days ? `${c.days}д ` : ""}
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
      <div aria-hidden="true" className={large ? "flex flex-col gap-2" : "flex items-center gap-3"}>
        <div className={large ? "text-[13px] font-medium text-muted" : "text-xs text-muted"}>До конца распродажи</div>
        <div className={`flex items-start ${large ? "gap-1.5" : "gap-1"}`}>
          {cells.map((x, i) => (
            <div key={x.label} className={`flex items-start ${large ? "gap-1.5" : "gap-1"}`}>
              {i > 0 ? (
                <span className={`font-bold leading-none text-ink ${large ? "py-2.5 text-[24px] md:text-[28px]" : "py-1 text-base"}`}>
                  :
                </span>
              ) : null}
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className={`rounded-[6px] bg-ink text-center font-bold leading-none tabular-nums text-white ${
                    large ? "min-w-[52px] rounded-[10px] px-2.5 py-2.5 text-[24px] md:min-w-[60px] md:text-[28px]" : "min-w-[34px] px-2 py-1 text-base"
                  }`}
                >
                  {x.n}
                </div>
                <div className={`leading-tight text-muted ${large ? "mt-0.5 text-[12px]" : "text-[10px]"}`}>
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

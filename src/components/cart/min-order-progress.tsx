import { formatPriceValue } from "@/lib/format";
import { MIN_ORDER } from "@/lib/cart/store";

export const minOrderRatio = (total: number) => Math.max(0, Math.min(total / MIN_ORDER, 1));

/** Цвет заливки по прогрессу; на тёмном фоне красный светлее для контраста. */
function toneColor(total: number, onDark: boolean) {
  const r = minOrderRatio(total);
  if (r >= 1) return "#3BB273";
  if (r >= 0.8) return "#7BD389";
  if (r >= 0.5) return "#F5A524";
  return onDark ? "#FF5A5F" : "#D02E31";
}

/** Единый индикатор прогресса до минимального заказа. */
export function MinOrderProgress({
  total,
  height = 8,
  onDark = false,
  trackClassName,
  className = "",
}: {
  total: number;
  height?: number;
  onDark?: boolean;
  trackClassName?: string;
  className?: string;
}) {
  const r = minOrderRatio(total);
  return (
    <div
      aria-hidden="true"
      style={{ height }}
      className={`overflow-hidden rounded-full ${trackClassName ?? (onDark ? "bg-white/20" : "bg-line")} ${className}`}
    >
      <div
        className={`h-full rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-300 ${r >= 0.8 && r < 1 ? "min-order-pulse" : ""}`}
        style={{ width: `${r * 100}%`, backgroundColor: toneColor(total, onDark) }}
      />
    </div>
  );
}

/** Подсказка о остатке до минимального заказа (null, если набрано). */
export function minOrderHint(total: number) {
  const left = formatPriceValue(minOrderRemaining(total));
  if (total >= MIN_ORDER) return null;
  return minOrderRatio(total) >= 0.8 ? `Почти! Осталось всего ${left}` : `До минимального заказа осталось ${left}`;
}

/** Текст «осталось …» / «набрана» для карточек и корзины. */
export function minOrderRemaining(total: number) {
  return Math.max(0, MIN_ORDER - total);
}

export function MinOrderCaption({ total }: { total: number }) {
  return (
    <>
      {formatPriceValue(total)} из {formatPriceValue(MIN_ORDER)}
    </>
  );
}

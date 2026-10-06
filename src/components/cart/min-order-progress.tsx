import { formatPriceValue } from "@/lib/format";
import { MIN_ORDER } from "@/lib/cart/store";

export const minOrderRatio = (total: number) => Math.max(0, Math.min(total / MIN_ORDER, 1));

/** Единый индикатор прогресса до минимального заказа. */
export function MinOrderProgress({
  total,
  height = 8,
  trackClassName = "bg-white/20",
  fillClassName = "bg-white",
  className = "",
}: {
  total: number;
  height?: number;
  trackClassName?: string;
  fillClassName?: string;
  className?: string;
}) {
  const reached = total >= MIN_ORDER;
  return (
    <div
      aria-hidden="true"
      style={{ height }}
      className={`overflow-hidden rounded-full ${trackClassName} ${className}`}
    >
      <div
        className={`h-full rounded-full motion-safe:transition-[width,background-color] ${reached ? "bg-[#3BB273]" : fillClassName}`}
        style={{ width: `${minOrderRatio(total) * 100}%` }}
      />
    </div>
  );
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

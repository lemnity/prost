"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { plural } from "@/lib/plural";
import { formatPriceValue } from "@/lib/format";
import { MIN_ORDER, cartCount, cartTotal } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";
import { MinOrderCaption, MinOrderProgress, minOrderHint } from "./min-order-progress";

const popBase =
  "inline-flex w-full items-center justify-center whitespace-nowrap rounded-[10px] px-4 text-[14px] font-semibold transition-colors";
const popPrimary = `${popBase} h-11 bg-brand text-white hover:bg-brand-hover`;
const popOutline = `${popBase} h-10 border border-line bg-white text-ink hover:bg-surface`;

/** Ссылка «Корзина» в шапке: бейдж количества, сумма и прогресс до минимального заказа. Сервер рендерит пустое состояние. */
export function CartLink({ className }: { className: string }) {
  const items = useCart();
  const n = cartCount(items);
  // В бейдже — число позиций: при оптовых количествах сумма штук всегда «99+».
  const positions = items.length;
  const total = cartTotal(items);
  const reached = total >= MIN_ORDER;
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const label = n
    ? `Корзина, ${positions} ${plural("item", positions)}, на сумму ${formatPriceValue(total)}. ${
        reached ? "Минимальная сумма заказа набрана" : minOrderHint(total)
      }`
    : "Корзина";

  return (
    <div
      ref={wrap}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onFocus={(e) => e.target.matches(":focus-visible") && setOpen(true)}
      onBlur={(e) => {
        if (!wrap.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <Link href="/cart" aria-label={label} className={`relative ${className}`}>
        <span className="relative grid place-items-center">
          <ShoppingCart size={22} aria-hidden />
          {n > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -right-3 -top-3 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none text-white"
            >
              {positions > 99 ? "99+" : positions}
            </span>
          ) : null}
        </span>
        <span className="hidden min-w-0 truncate text-[15px] font-semibold tabular-nums md:inline">
          {n > 0 ? formatPriceValue(total) : "Корзина"}
        </span>
        {n > 0 ? (
          <MinOrderProgress
            total={total}
            height={3}
            onDark
            className="pointer-events-none absolute inset-x-3 bottom-[5px]"
          />
        ) : null}
      </Link>
      {n > 0 && open ? (
        <div className="absolute right-0 top-full z-50 hidden w-[300px] pt-2 md:block">
          <div className="rounded-[12px] bg-white p-4 text-ink shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
            {reached ? (
              <>
                <p className="flex items-center gap-2 text-[15px] font-semibold text-[#25704f]">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#3BB273] text-white">
                    <Check size={13} strokeWidth={3} aria-hidden />
                  </span>
                  Минимальная сумма заказа набрана
                </p>
                <p className="mt-1 text-[13px] text-muted">Можно оформлять заказ</p>
                <MinOrderProgress total={total} height={8} className="mt-3" />
                <div className="mt-3 grid gap-2">
                  <Link href="/checkout" className={popPrimary}>
                    Оформить заказ
                  </Link>
                  <Link href="/cart" className={popOutline}>
                    Перейти в корзину
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold leading-snug">
                  {minOrderHint(total)}
                </p>
                <MinOrderProgress total={total} height={8} className="mt-3" />
                <p className="mt-1.5 text-[13px] tabular-nums text-muted">
                  <MinOrderCaption total={total} />
                </p>
                <Link href="/cart" className={`${popPrimary} mt-3`}>
                  Перейти в корзину
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { plural } from "@/lib/plural";
import { cartCount } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";

/** Ссылка «Корзина» в шапке с бейджем количества. Сервер рендерит 0. */
export function CartLink({ className }: { className: string }) {
  const n = cartCount(useCart());
  return (
    <Link href="/cart" aria-label={n ? `Корзина, ${n} ${plural("item", n)}` : "Корзина"} className={className}>
      <span className="relative grid place-items-center">
        <ShoppingCart size={22} aria-hidden />
        {n > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-3 -top-3 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none text-white"
          >
            {n > 99 ? "99+" : n}
          </span>
        ) : null}
      </span>
      <span className="hidden text-[15px] font-semibold md:inline">Корзина</span>
    </Link>
  );
}

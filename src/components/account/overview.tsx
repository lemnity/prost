"use client";

import Link from "next/link";
import { ArrowRight, Building2, Heart, Package, ShoppingCart } from "lucide-react";
import { formatPriceValue } from "@/lib/format";
import { plural } from "@/lib/plural";
import { cartTotal } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";
import { useFavorites } from "@/lib/favorites/use-favorites";
import { FAVORITES_HREF } from "@/lib/favorites/store";
import { useSession } from "@/lib/account/use-account";
import { MinOrderProgress, minOrderHint } from "@/components/cart/min-order-progress";
import { EmptyOrders, OrderCard, formatDate } from "./orders";

function Tile({ href, Icon, label, value, note }: { href: string; Icon: typeof Heart; label: string; value: string; note: React.ReactNode }) {
  return (
    <Link href={href} className="group flex flex-col rounded-[14px] border border-line bg-white p-5 hover:border-brand">
      <span className="flex items-center justify-between text-[14px] font-medium text-muted">
        <span className="flex items-center gap-2">
          <Icon size={18} aria-hidden="true" className="text-brand" />
          {label}
        </span>
        <ArrowRight size={16} aria-hidden="true" className="motion-safe:transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
      </span>
      <span className="mt-3 text-[26px] font-bold leading-none tabular-nums">{value}</span>
      <span className="mt-2 text-[13px] text-muted">{note}</span>
    </Link>
  );
}

export function AccountOverview() {
  const s = useSession();
  const favs = useFavorites();
  const cart = useCart();
  if (!s) return null;
  const total = cartTotal(cart);
  const last = s.orders[0];
  const noRequisites = !s.profile.company || !s.profile.inn;

  return (
    <div className="grid gap-6">
      <p className="text-[17px]">
        Здравствуйте, <strong>{s.profile.name}</strong>!
        <span className="text-muted"> Кабинет создан {formatDate(s.createdAt)}</span>
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile
          href="/account/orders"
          Icon={Package}
          label="Заказы"
          value={String(s.orders.length)}
          note={last ? `Последний — ${formatDate(last.date)}` : "Ещё не было заказов"}
        />
        <Tile
          href={FAVORITES_HREF}
          Icon={Heart}
          label="Избранное"
          value={String(favs.length)}
          note={favs.length ? `${favs.length} ${plural("item", favs.length)} в подборке` : "Отмечайте товары сердечком"}
        />
        <Tile
          href="/cart"
          Icon={ShoppingCart}
          label="Корзина"
          value={formatPriceValue(total)}
          note={
            cart.length ? (
              <>
                <MinOrderProgress total={total} height={4} className="mb-1.5" />
                {minOrderHint(total) ?? "Минимальная сумма набрана"}
              </>
            ) : (
              "Корзина пуста"
            )
          }
        />
      </div>

      {noRequisites ? (
        <div className="flex flex-col gap-3 rounded-[14px] bg-brand-soft p-4 sm:flex-row sm:items-center">
          <Building2 size={26} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand" />
          <p className="text-[14px] sm:flex-1">
            <span className="font-semibold">Добавьте компанию и ИНН</span>
            <span className="text-muted"> — они подставятся в заказ для выставления счёта.</span>
          </p>
          <Link href="/account/profile" className="text-[14px] font-semibold text-brand hover:text-brand-hover">
            Заполнить реквизиты
          </Link>
        </div>
      ) : null}

      <section aria-labelledby="recent-orders">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="recent-orders" className="text-[20px] font-bold">Последние заказы</h2>
          {s.orders.length > 2 ? (
            <Link href="/account/orders" className="text-[14px] font-medium text-brand hover:text-brand-hover">Все заказы</Link>
          ) : null}
        </div>
        {s.orders.length ? (
          <ul className="grid gap-3">
            {s.orders.slice(0, 2).map((o) => (
              <li key={o.number}>
                <OrderCard order={o} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyOrders />
        )}
      </section>
    </div>
  );
}

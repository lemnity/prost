"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronDown, MessageCircle, Package, RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { asset } from "@/lib/asset";
import { formatPriceValue } from "@/lib/format";
import { plural } from "@/lib/plural";
import { addToCart, cartCount } from "@/lib/cart/store";
import type { SavedOrder } from "@/lib/account/store";
import { useSession } from "@/lib/account/use-account";
import { useChats } from "@/lib/chat/use-chats";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

function repeat(o: SavedOrder) {
  o.items.forEach(({ qty, ...item }) => addToCart(item, qty));
}

export function OrderCard({ order: o, open: initial = false }: { order: SavedOrder; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  const [done, setDone] = useState(false);
  const hasChat = !!useChats()[o.number];
  const n = cartCount(o.items);
  const id = `order-${o.number}`;
  return (
    <article className="rounded-[14px] border border-line bg-white">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 md:p-5">
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold">Заказ № {o.number}</h3>
          <p className="mt-0.5 text-[13px] text-muted">
            {formatDate(o.date)} · {n} {plural("item", n)} · {o.delivery}
          </p>
        </div>
        <span className="rounded-full bg-new-bg px-2.5 py-1 text-[12px] font-medium text-new-text">Отправлен менеджеру</span>
        <p className="text-[18px] font-bold tabular-nums">от {formatPriceValue(o.total)}</p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 items-center gap-1 text-[13px] font-medium text-muted hover:text-brand"
        >
          {open ? "Свернуть" : "Состав"}
          <ChevronDown size={16} aria-hidden="true" className={`motion-safe:transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div id={id} hidden={!open} className="border-t border-line p-4 md:p-5">
        <ul className="grid gap-3">
          {o.items.map((i) => (
            <li key={i.id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3">
              <span className="relative aspect-square overflow-hidden rounded-md bg-surface">
                <ProductImage src={asset(i.image)} alt="" sizes="48px" fallback="mini" className="object-contain" />
              </span>
              <span className="min-w-0 text-[13px] leading-snug">
                <Link href={i.url} className="line-clamp-2 text-ink hover:text-brand">{i.title}</Link>
                <span className="text-muted">Арт. {i.sku} · {i.qty} шт × {formatPriceValue(i.price)}</span>
              </span>
              <span className="text-[14px] font-semibold tabular-nums">{formatPriceValue(i.qty * i.price)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-muted">Оплата: {o.payment}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              repeat(o);
              setDone(true);
            }}
            className={buttonClass()}
          >
            {done ? <Check size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
            {done ? "Добавлено в корзину" : "Повторить заказ"}
          </button>
          {done ? <Link href="/cart" className={buttonClass({ variant: "outline" })}>Перейти в корзину</Link> : null}
          {hasChat ? (
            <Link href={`/account/chat?order=${encodeURIComponent(o.number)}`} className={buttonClass({ variant: "outline" })}>
              <MessageCircle size={16} aria-hidden="true" />
              Чат по заявке
            </Link>
          ) : null}
        </div>
        <p role="status" className="sr-only">{done ? "Товары заказа добавлены в корзину" : ""}</p>
      </div>
    </article>
  );
}

export function EmptyOrders() {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-surface px-5 py-12 text-center">
      <Package size={36} strokeWidth={1.5} aria-hidden="true" className="text-brand" />
      <h2 className="mt-4 text-[20px] font-bold">Заказов пока нет</h2>
      <p className="mt-2 max-w-md text-sm text-muted">Оформленные из корзины заказы появятся здесь — их можно будет повторить в один клик.</p>
      <Link href="/catalog" className={`${buttonClass({ size: "lg", px: "px-8" })} mt-6`}>Перейти в каталог</Link>
    </div>
  );
}

export function OrdersList() {
  const s = useSession();
  if (!s) return null;
  if (!s.orders.length) return <EmptyOrders />;
  return (
    <ul className="grid gap-3">
      {s.orders.map((o, i) => (
        <li key={o.number}>
          <OrderCard order={o} open={i === 0} />
        </li>
      ))}
    </ul>
  );
}

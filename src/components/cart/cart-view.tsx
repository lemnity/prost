"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { asset } from "@/lib/asset";
import { formatPriceValue } from "@/lib/format";
import { MIN_ORDER, cartCount, cartTotal, clearCart, removeFromCart, type CartItem } from "@/lib/cart/store";
import { useCart, useHydrated } from "@/lib/cart/use-cart";
import { MinOrderProgress, minOrderHint } from "./min-order-progress";
import { QtyStepper } from "./qty-stepper";

const btnPrimary =
  "inline-flex h-[52px] items-center justify-center rounded-lg bg-brand px-8 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-faint disabled:hover:bg-faint";
const btnOutline =
  "inline-flex h-12 items-center justify-center rounded-lg border border-brand bg-white px-6 text-[15px] font-semibold text-brand hover:bg-brand hover:text-white";

export function CartView() {
  const items = useCart();
  const hydrated = useHydrated();
  const pendingFocus = useRef<{ id: string | null } | null>(null);

  useEffect(() => {
    const p = pendingFocus.current;
    if (!p) return;
    pendingFocus.current = null;
    const target = p.id
      ? Array.from(document.querySelectorAll<HTMLElement>(`[data-remove="${CSS.escape(p.id)}"]`)).find((el) => el.offsetParent !== null)
      : null;
    (target ?? document.getElementById("cart-heading"))?.focus();
  }, [items]);

  function remove(id: string) {
    const idx = items.findIndex((i) => i.id === id);
    pendingFocus.current = { id: items[idx + 1]?.id ?? items[idx - 1]?.id ?? null };
    removeFromCart(id);
  }

  if (!hydrated) {
    return (
      <section aria-label="Корзина загружается" aria-busy="true" className="py-6 md:py-8">
        <Container className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <div className="min-h-[300px] animate-pulse rounded-[10px] bg-surface motion-reduce:animate-none" />
          <div className="hidden min-h-[220px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none lg:block" />
        </Container>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section aria-label="Пустая корзина" className="py-8 md:py-10">
        <Container>
          <div className="flex flex-col items-center rounded-[14px] bg-surface px-5 py-12 text-center md:py-16">
            <ShoppingCart size={40} strokeWidth={1.5} aria-hidden="true" className="text-brand" />
            <h2 id="cart-heading" tabIndex={-1} className="mt-4 text-[22px] font-bold outline-none md:text-[26px]">Корзина пуста</h2>
            <p className="mt-2 max-w-md text-sm text-muted">
              Добавьте товары из каталога, чтобы оформить заказ.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/catalog" className={btnPrimary}>Перейти в каталог</Link>
              <Link href="/#new-products-title" className={btnOutline}>Новинки</Link>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section aria-label="Состав заказа" className="py-6 md:py-8">
      <Container className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 id="cart-heading" tabIndex={-1} className="sr-only">Состав заказа</h2>
          <ul className="grid gap-3">
            {items.map((i) => (
              <li
                key={i.id}
                className="grid grid-cols-[88px_1fr] gap-x-4 gap-y-3 rounded-[10px] border border-line bg-white p-3 sm:grid-cols-[96px_1fr_auto_auto] sm:items-center sm:gap-y-0"
              >
                <Link href={i.url} tabIndex={-1} aria-hidden="true" className="relative row-span-1 aspect-square">
                  <Image src={asset(i.image)} alt="" fill sizes="96px" className="object-contain" />
                </Link>
                <div className="min-w-0">
                  <Link href={i.url} className="line-clamp-2 text-[14px] font-medium leading-snug text-ink hover:text-brand">
                    {i.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    Арт. {i.sku}
                    {i.preorder ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Под заказ</span> : null}
                  </p>
                  <p className="mt-1 text-[13px] text-muted">от {formatPriceValue(i.price)}</p>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end">
                  <QtyStepper id={i.id} qty={i.qty} title={i.title} />
                  <button
                    type="button"
                    aria-label={`Удалить: ${i.title}`}
                    data-remove={i.id}
                    onClick={() => remove(i.id)}
                    className="grid size-9 place-items-center rounded-lg text-muted hover:text-brand sm:hidden"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:justify-end sm:gap-3">
                  <span className="text-base font-bold tabular-nums sm:w-28 sm:text-right">
                    {formatPriceValue(i.qty * i.price)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Удалить: ${i.title}`}
                    data-remove={i.id}
                    onClick={() => remove(i.id)}
                    className="hidden size-9 place-items-center rounded-lg text-muted hover:text-brand sm:grid"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Summary items={items} />
      </Container>
    </section>
  );
}

function Summary({ items }: { items: readonly CartItem[] }) {
  const total = cartTotal(items);
  const count = cartCount(items);
  const reached = total >= MIN_ORDER;
  return (
    <div className="lg:sticky lg:top-28">
    <aside aria-label="Итого" className="rounded-[14px] bg-surface p-5 md:p-6">
      <div aria-live="polite" aria-atomic="true">
        <p className="text-sm text-muted">Товаров: {count}</p>
        <p className="mt-1 text-[22px] font-bold md:text-[26px]">Итого: от {formatPriceValue(total)}</p>
        <MinOrderProgress total={total} height={6} trackClassName="bg-white" className="mt-3" />
        <p className={`mt-2 text-[13px] ${reached ? "font-medium text-new-text" : "text-muted"}`}>
          {reached
            ? "Минимальная сумма заказа достигнута ✓"
            : minOrderHint(total)}
        </p>
      </div>
      {reached ? (
        <Link href="/checkout" className={`${btnPrimary} mt-5 w-full`}>
          Оформить заказ
        </Link>
      ) : (
        <>
          <button type="button" disabled aria-describedby="min-hint" className={`${btnPrimary} mt-5 w-full`}>
            Оформить заказ
          </button>
          <p id="min-hint" className="mt-2 text-xs text-muted">
            Оформление доступно от {formatPriceValue(MIN_ORDER)}
          </p>
        </>
      )}
    </aside>
    <ClearCart />
    </div>
  );
}

function ClearCart() {
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!asking) return;
    const t = setTimeout(() => setAsking(false), 4000);
    return () => clearTimeout(t);
  }, [asking]);
  return (
    <div className="mt-4 flex min-h-9 items-center justify-center text-[13px]">
      {asking ? (
        <div role="group" aria-label="Подтверждение очистки корзины" className="flex items-center gap-3">
          <span className="text-muted">Точно очистить?</span>
          <button type="button" onClick={() => clearCart()} className="font-semibold text-brand hover:underline">
            Да
          </button>
          <button type="button" onClick={() => setAsking(false)} className="font-semibold text-muted hover:text-ink">
            Нет
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAsking(true)}
          className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-brand"
        >
          <Trash2 size={15} aria-hidden="true" />
          Очистить корзину
        </button>
      )}
    </div>
  );
}

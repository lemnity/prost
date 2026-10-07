"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonClass, selectClass } from "@/components/ui/button";
import { ProductCard } from "@/components/catalog/product-card";
import { addToCart } from "@/lib/cart/store";
import { useCart, useHydrated } from "@/lib/cart/use-cart";
import { clearFavorites, type FavoriteItem } from "@/lib/favorites/store";
import { favoriteToProduct } from "@/lib/favorites/item";
import { useFavorites } from "@/lib/favorites/use-favorites";
import { plural } from "@/lib/plural";

type Sort = "added" | "cheap" | "expensive" | "sale";

const SORTS: { value: Sort; label: string }[] = [
  { value: "added", label: "Сначала добавленные недавно" },
  { value: "cheap", label: "Сначала дешевле" },
  { value: "expensive", label: "Сначала дороже" },
  { value: "sale", label: "Сначала со скидкой" },
];

const SORTERS: Record<Sort, (a: FavoriteItem, b: FavoriteItem) => number> = {
  added: (a, b) => b.addedAt - a.addedAt,
  cheap: (a, b) => a.price - b.price,
  expensive: (a, b) => b.price - a.price,
  sale: (a, b) => Number(!!b.oldPrice) - Number(!!a.oldPrice) || b.addedAt - a.addedAt,
};

export function FavoritesView({ embedded = false }: { embedded?: boolean } = {}) {
  const items = useFavorites();
  const cart = useCart();
  const hydrated = useHydrated();
  const [sort, setSort] = useState<Sort>("added");
  const [confirm, setConfirm] = useState(false);
  const [added, setAdded] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!hydrated) {
    return (
      <section aria-label="Избранное загружается" aria-busy="true" className={embedded ? undefined : "py-6 md:py-8"}>
        <Box embedded={embedded}>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className={`aspect-[3/4] animate-pulse rounded-[10px] bg-surface motion-reduce:animate-none ${i > 1 ? "hidden md:block" : ""}`} />
            ))}
          </ul>
        </Box>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section aria-label="Пустое избранное" className={embedded ? undefined : "py-8 md:py-10"}>
        <Box embedded={embedded}>
          <div className="flex flex-col items-center rounded-[14px] bg-surface px-5 py-12 text-center md:py-16">
            <Heart size={40} strokeWidth={1.5} aria-hidden="true" className="text-brand" />
            <h2 id="favorites-heading" tabIndex={-1} className="mt-4 text-[22px] font-bold outline-none md:text-[26px]">
              В избранном пока пусто
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted">
              Нажмите на сердечко на карточке товара, чтобы сохранить его здесь и вернуться к нему позже.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/catalog" className={buttonClass({ size: "lg", px: "px-8" })}>Перейти в каталог</Link>
              <Link href="/#new-products-title" className={buttonClass({ variant: "outline", size: "lg" })}>Новинки</Link>
            </div>
          </div>
        </Box>
      </section>
    );
  }

  const list = [...items].sort(SORTERS[sort]);
  const inCart = new Set(cart.map((i) => i.id));
  const buyable = items.filter((i) => i.stock > 0 && !inCart.has(i.id));

  function addAll() {
    buyable.forEach((i) =>
      addToCart({
        id: i.id,
        sku: i.sku,
        title: i.title,
        image: i.image,
        url: i.url,
        price: i.price,
        ...(i.oldPrice ? { oldPrice: i.oldPrice } : {}),
      }),
    );
    setAdded(buyable.length);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(0), 2500);
  }

  return (
    <section aria-labelledby="favorites-heading" className={embedded ? undefined : "py-6 md:py-8"}>
      <Box embedded={embedded}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="favorites-heading" tabIndex={-1} className="mr-auto text-[15px] text-muted outline-none">
            {items.length} {plural("item", items.length)}
          </h2>
          <label className="flex items-center gap-2 text-[13px] text-muted">
            <span className="hidden sm:inline">Сортировка</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Сортировка"
              className={selectClass({ size: "sm" })}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>

        <ul className={`mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 ${embedded ? "xl:grid-cols-4" : "lg:grid-cols-4 xl:grid-cols-5"}`}>
          {list.map((f) => (
            <li key={f.id}>
              <ProductCard product={favoriteToProduct(f)} />
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button
            type="button"
            onClick={addAll}
            disabled={buyable.length === 0}
            className={`${buttonClass({ size: "lg", px: "px-6" })} w-full sm:w-auto`}
          >
            {added ? (
              <>
                Добавлено: {added} <Check size={16} aria-hidden="true" />
              </>
            ) : (
              <>
                <ShoppingCart size={16} aria-hidden="true" />
                {buyable.length ? `Добавить в корзину все (${buyable.length})` : "Всё в наличии уже в корзине"}
              </>
            )}
          </button>
          <Link href="/cart" className={`${buttonClass({ variant: "outline", size: "lg" })} w-full sm:w-auto`}>
            Перейти в корзину
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {confirm ? (
              <>
                <span className="text-[13px] text-muted">Очистить избранное?</span>
                <button
                  type="button"
                  onClick={() => {
                    clearFavorites();
                    setConfirm(false);
                    requestAnimationFrame(() => document.getElementById("favorites-heading")?.focus());
                  }}
                  className={buttonClass({ size: "sm" })}
                >
                  Да, очистить
                </button>
                <button type="button" onClick={() => setConfirm(false)} className={buttonClass({ variant: "outline", size: "sm" })}>
                  Отмена
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirm(true)}
                className="inline-flex h-9 items-center gap-1.5 text-[13px] text-muted hover:text-brand"
              >
                <Trash2 size={15} aria-hidden="true" />
                Очистить избранное
              </button>
            )}
          </div>
        </div>
        <p role="status" className="sr-only">
          {added ? `Добавлено в корзину: ${added} ${plural("item", added)}` : ""}
        </p>
        <p className="mt-3 text-[12px] text-muted">
          Избранное хранится в этом браузере. Товары без остатка можно запросить у менеджера.
        </p>
      </Box>
    </section>
  );
}

/** Внутри кабинета — без своего контейнера и отступов. */
function Box({ embedded, className = "", children }: { embedded: boolean; className?: string; children: React.ReactNode }) {
  return embedded ? <div className={className}>{children}</div> : <Container className={className}>{children}</Container>;
}

"use client";

import { startTransition, useCallback, useEffect, useId, useMemo, useOptimistic, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "./product-card";
import type { ListingProduct } from "@/lib/catalog/types";
import { productsLabel } from "@/lib/format";

const PAGE = 24;

const SORTS = [
  { id: "popular", label: "Популярные" },
  { id: "price-asc", label: "Сначала дешёвые" },
  { id: "price-desc", label: "Сначала дорогие" },
  { id: "stock", label: "По наличию" },
] as const;
type Sort = (typeof SORTS)[number]["id"];

type Filters = {
  sort: Sort;
  min: number | null;
  max: number | null;
  inStock: boolean;
  brands: string[];
};

function num(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parse(query: string): Filters {
  const sp = new URLSearchParams(query);
  const sort = sp.get("sort");
  return {
    sort: SORTS.some((s) => s.id === sort) ? (sort as Sort) : "popular",
    min: num(sp.get("min")),
    max: num(sp.get("max")),
    inStock: sp.get("stock") === "1",
    brands: sp.getAll("brand"),
  };
}

function serialize(f: Filters): string {
  const sp = new URLSearchParams();
  if (f.sort !== "popular") sp.set("sort", f.sort);
  if (f.min != null) sp.set("min", String(f.min));
  if (f.max != null) sp.set("max", String(f.max));
  if (f.inStock) sp.set("stock", "1");
  for (const b of f.brands) sp.append("brand", b);
  return sp.toString();
}

function apply(products: ListingProduct[], f: Filters): ListingProduct[] {
  const list = products.filter(
    (p) =>
      (f.min == null || p.priceFrom >= f.min) &&
      (f.max == null || p.priceFrom <= f.max) &&
      (!f.inStock || p.stock > 0) &&
      (f.brands.length === 0 || f.brands.includes(p.brand)),
  );
  if (f.sort === "price-asc") list.sort((a, b) => a.priceFrom - b.priceFrom);
  else if (f.sort === "price-desc") list.sort((a, b) => b.priceFrom - a.priceFrom);
  else if (f.sort === "stock") list.sort((a, b) => b.stock - a.stock);
  return list;
}

type Props = { products: ListingProduct[]; brands: string[] };

/** Островок с фильтрами: читает состояние из URL. */
export function CatalogListingIsland(props: Props) {
  const sp = useSearchParams();
  return <CatalogListing {...props} query={sp.toString()} />;
}

/** Листинг: тулбар, фильтры и сетка. Без query — статичный рендер (SSR/SEO). */
export function CatalogListing({ products, brands, query: urlQuery = "" }: Props & { query?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  // Мгновенный отклик контролов, пока URL обновляется.
  const [query, setQuery] = useOptimistic(urlQuery);
  const filters = useMemo(() => parse(query), [query]);
  const list = useMemo(() => apply(products, filters), [products, filters]);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const active =
    (filters.min != null || filters.max != null ? 1 : 0) + (filters.inStock ? 1 : 0) + filters.brands.length;

  function update(next: Partial<Filters>) {
    const qs = serialize({ ...filters, ...next });
    startTransition(() => {
      setQuery(qs);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }
  const reset = () => update({ min: null, max: null, inStock: false, brands: [] });

  const panel = (
    <FilterPanel filters={filters} brands={brands} onChange={update} onReset={reset} />
  );

  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <aside aria-label="Фильтры" className="hidden lg:sticky lg:top-[88px] lg:block">
        {panel}
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-[13px] text-muted">
            Найдено <span className="font-semibold text-ink">{productsLabel(list.length)}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[13px] font-medium text-ink hover:border-brand lg:hidden"
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
              Фильтры
              {active ? (
                <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
                  {active}
                </span>
              ) : null}
            </button>
            <label className="sr-only" htmlFor="catalog-sort">
              Сортировка
            </label>
            <select
              id="catalog-sort"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as Sort })}
              className="h-9 rounded-lg border border-line bg-white px-2 text-[13px] text-ink hover:border-brand"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {list.length ? (
          <ProductGrid key={query} products={list} />
        ) : (
          <div className="rounded-[10px] bg-surface p-8 text-center">
            <p className="text-[15px] font-semibold">Ничего не найдено</p>
            <p className="mt-1 text-sm text-muted">Попробуйте изменить параметры фильтра.</p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      {open ? (
        <Drawer onClose={close} count={list.length}>
          {panel}
        </Drawer>
      ) : null}
    </div>
  );
}

function ProductGrid({ products }: { products: ListingProduct[] }) {
  const [shown, setShown] = useState(PAGE);
  const rest = products.length - shown;
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {products.slice(0, shown).map((p) => (
          <li key={p.url} className="grid">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="inline-flex h-11 items-center rounded-lg border border-brand bg-white px-6 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
          >
            Показать ещё {Math.min(rest, PAGE)}
          </button>
        </div>
      ) : null}
    </>
  );
}

function FilterPanel({
  filters,
  brands,
  onChange,
  onReset,
}: {
  filters: Filters;
  brands: string[];
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const id = useId();
  const [min, setMin] = useState(filters.min?.toString() ?? "");
  const [max, setMax] = useState(filters.max?.toString() ?? "");
  // Синхронизация черновиков цены с URL (назад/вперёд, «Сбросить»).
  const [synced, setSynced] = useState([filters.min, filters.max]);
  if (synced[0] !== filters.min || synced[1] !== filters.max) {
    setSynced([filters.min, filters.max]);
    setMin(filters.min?.toString() ?? "");
    setMax(filters.max?.toString() ?? "");
  }
  const commitPrice = () => {
    const a = num(min.trim() || null);
    const b = num(max.trim() || null);
    if (a !== filters.min || b !== filters.max) onChange({ min: a, max: b });
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitPrice();
  };
  const field =
    "h-9 w-full min-w-0 rounded-lg border border-line bg-white px-3 text-[13px] text-ink placeholder:text-faint hover:border-brand";
  return (
    <div className="space-y-5 rounded-[10px] border border-line bg-white p-4">
      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold">Цена, ₽</legend>
        <div className="flex items-center gap-2">
          <label htmlFor={`${id}-min`} className="sr-only">
            Цена от
          </label>
          <input
            id={`${id}-min`}
            inputMode="numeric"
            placeholder="от"
            value={min}
            onChange={(e) => setMin(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={commitPrice}
            onKeyDown={onKey}
            className={field}
          />
          <span aria-hidden="true" className="text-muted">
            –
          </span>
          <label htmlFor={`${id}-max`} className="sr-only">
            Цена до
          </label>
          <input
            id={`${id}-max`}
            inputMode="numeric"
            placeholder="до"
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={commitPrice}
            onKeyDown={onKey}
            className={field}
          />
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(e) => onChange({ inStock: e.target.checked })}
          className="size-4 accent-brand"
        />
        Только в наличии
      </label>

      {brands.length ? (
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold">Поставщик</legend>
          <ul className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
            {brands.map((b) => (
              <li key={b}>
                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(b)}
                    onChange={(e) =>
                      onChange({
                        brands: e.target.checked
                          ? [...filters.brands, b]
                          : filters.brands.filter((x) => x !== b),
                      })
                    }
                    className="size-4 accent-brand"
                  />
                  {b}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-line text-[13px] font-medium text-ink hover:border-brand hover:text-brand"
      >
        Сбросить
      </button>
    </div>
  );
}

function Drawer({
  children,
  onClose,
  count,
}: {
  children: React.ReactNode;
  onClose: () => void;
  count: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button, input")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Фильтры"
        className="absolute inset-y-0 left-0 flex w-[320px] max-w-[88vw] flex-col bg-white shadow-xl motion-safe:animate-[drawer-in_.2s_ease-out]"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <span className="text-[15px] font-semibold">Фильтры</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть фильтры"
            className="grid size-9 place-items-center text-muted hover:text-brand"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 [&>div]:border-0 [&>div]:p-0">{children}</div>
        <div className="border-t border-line p-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Показать {productsLabel(count)}
          </button>
        </div>
      </div>
    </div>
  );
}

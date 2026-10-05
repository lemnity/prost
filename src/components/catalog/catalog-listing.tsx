"use client";

import { startTransition, useCallback, useEffect, useMemo, useOptimistic, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "./product-card";
import {
  EMPTY_FILTERS,
  SORTS,
  activeCount,
  apply,
  colorOptions,
  parse,
  serialize,
  valueOptions,
  withCounts,
  type Filters,
  type Sort,
} from "./catalog-filters";
import { FilterPanel, type Group } from "./filter-panel";
import type { ListingProduct } from "@/lib/catalog/types";
import { productsLabel } from "@/lib/format";

const PAGE = 24;

type Props = {
  products: ListingProduct[];
  /** Серверный блок «Разделы» для сайдбара (lg+). */
  sectionsNav?: ReactNode;
  /** Выбор раздела для <lg. */
  sectionsSelect?: ReactNode;
};

type Chip = { id: string; label: string; clear: Partial<Filters> };

/** Островок с фильтрами: читает состояние из URL. */
export function CatalogListingIsland(props: Props) {
  const sp = useSearchParams();
  return <CatalogListing {...props} query={sp.toString()} />;
}

const BASES = {
  suppliers: (p: ListingProduct) => [p.supplier],
  materials: (p: ListingProduct) => p.materials,
  brands: (p: ListingProduct) => [p.brand],
  colors: (p: ListingProduct) => p.colors,
} as const;

/** Листинг: сайдбар (разделы + фильтры), заголовок результатов, чипы и сетка. Без query — статичный рендер. */
export function CatalogListing({
  products,
  sectionsNav,
  sectionsSelect,
  query: urlQuery = "",
}: Props & { query?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  // Мгновенный отклик контролов, пока URL обновляется.
  const [query, setQuery] = useOptimistic(urlQuery);
  const filters = useMemo(() => parse(query), [query]);
  const list = useMemo(() => apply(products, filters), [products, filters]);
  const base = useMemo(
    () => ({
      suppliers: valueOptions(products, BASES.suppliers),
      materials: valueOptions(products, BASES.materials),
      colors: colorOptions(products),
      brands: valueOptions(products, BASES.brands),
    }),
    [products],
  );
  const groups = useMemo<Group[]>(() => {
    const def = (key: Group["key"], label: string, empty: string): Group => ({
      key,
      label,
      hasData: base[key].length > 0,
      options: withCounts(products, filters, key, base[key], BASES[key]),
      empty,
    });
    return [
      def("suppliers", "Поставщик", "Нет данных о поставщиках в этом разделе"),
      def("materials", "Материал", "Нет данных о материалах в этом разделе"),
      def("colors", "Цвет", "Нет данных о цвете в этом разделе"),
      def("brands", "Бренд", "Нет данных о брендах в этом разделе"),
    ];
  }, [products, filters, base]);
  const hasNew = useMemo(() => products.some((p) => p.isNew), [products]);
  const [sheet, setSheet] = useState(false);
  const closeSheet = useCallback(() => setSheet(false), []);
  const active = activeCount(filters);

  function update(next: Partial<Filters>) {
    const qs = serialize({ ...filters, ...next });
    startTransition(() => {
      setQuery(qs);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }
  const reset = () => update(EMPTY_FILTERS);

  const chips = useMemo<Chip[]>(() => {
    const out: Chip[] = [];
    const labelOf = (key: Group["key"], v: string) => base[key].find((o) => o.value === v)?.label ?? v;
    const names = { suppliers: "Поставщик", materials: "Материал", colors: "Цвет", brands: "Бренд" } as const;
    for (const key of ["suppliers", "materials", "colors", "brands"] as const) {
      for (const v of filters[key]) {
        out.push({
          id: `${key}:${v}`,
          label: `${names[key]}: ${labelOf(key, v)}`,
          clear: { [key]: filters[key].filter((x) => x !== v) },
        });
      }
    }
    if (filters.min != null || filters.max != null) {
      const lo = filters.min != null ? filters.min : null;
      const hi = filters.max != null ? filters.max : null;
      const label = lo != null && hi != null ? `${lo}–${hi} ₽` : lo != null ? `от ${lo} ₽` : `до ${hi} ₽`;
      out.push({ id: "price", label: `Цена: ${label}`, clear: { min: null, max: null } });
    }
    if (filters.isNew) out.push({ id: "new", label: "Новинки", clear: { isNew: false } });
    if (filters.inStock) out.push({ id: "stock", label: "В наличии", clear: { inStock: false } });
    return out;
  }, [filters, base]);

  const panel = (
    <FilterPanel
      filters={filters}
      groups={groups}
      hasNew={hasNew}
      active={active}
      onChange={update}
      onReset={reset}
    />
  );

  return (
    <Layout
      nav={sectionsNav}
      select={sectionsSelect}
      panel={products.length ? <div className="rounded-[14px] border border-line bg-white p-3">{panel}</div> : null}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p role="status" className="w-full text-[14px] text-muted lg:w-auto lg:flex-1">
          Найдено <span className="font-semibold text-ink">{productsLabel(list.length)}</span>
        </p>
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3.5 text-[14px] font-medium text-ink hover:border-brand lg:hidden"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
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
          className="ml-auto h-10 rounded-lg border border-line bg-white px-2.5 text-[14px] text-ink hover:border-brand lg:ml-0"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {chips.length ? (
        <ul aria-label="Выбранные фильтры" className="mb-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => update(c.clear)}
                aria-label={`Убрать фильтр: ${c.label}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-soft pl-3 pr-2 text-[13px] font-medium text-brand hover:bg-brand hover:text-white"
              >
                {c.label}
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={reset}
              className="px-1 text-[13px] font-medium text-muted underline-offset-2 hover:text-brand hover:underline"
            >
              Сбросить всё
            </button>
          </li>
        </ul>
      ) : null}

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

      {sheet ? (
        <Drawer onClose={closeSheet} count={list.length}>
          {panel}
        </Drawer>
      ) : null}
    </Layout>
  );
}

/** Две колонки на lg+: сайдбар (разделы + фильтры) и контент. */
function Layout({
  nav,
  select,
  panel,
  children,
}: {
  nav?: ReactNode;
  select?: ReactNode;
  panel: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-8">
      <aside className="hidden self-stretch lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-112px)] space-y-3 overflow-y-auto overscroll-contain">
          {nav}
          {panel}
        </div>
      </aside>
      {select ? <div className="mb-3 lg:hidden">{select}</div> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ProductGrid({ products }: { products: ListingProduct[] }) {
  const [shown, setShown] = useState(PAGE);
  const rest = products.length - shown;
  return (
    <>
      <ul
        className={`grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 2xl:grid-cols-4`}
      >
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
      if (e.key === "Tab" && ref.current) {
        const f = [
          ...ref.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select, a[href], [tabindex]:not([tabindex="-1"])',
          ),
        ].filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        const cur = document.activeElement;
        if (e.shiftKey && (cur === first || !ref.current.contains(cur))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (cur === last || !ref.current.contains(cur))) {
          e.preventDefault();
          first.focus();
        }
      }
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
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
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

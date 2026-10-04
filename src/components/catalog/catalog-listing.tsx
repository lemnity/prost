"use client";

import { startTransition, useCallback, useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "./product-card";
import {
  EMPTY_FILTERS,
  OASIS_HINT,
  SORTS,
  activeCount,
  apply,
  valueOptions,
  type ListFilterKey,
  colorOptions,
  parse,
  serialize,
  type Filters,
  type Option,
  type Sort,
} from "./catalog-filters";
import { CheckChip, Dropdown, OptionList, OptionsPopover, PriceFields, PricePopover } from "./filter-controls";
import type { ListingProduct } from "@/lib/catalog/types";
import { productsLabel } from "@/lib/format";

const PAGE = 24;

type Props = { products: ListingProduct[] };

type Group = { key: Exclude<ListFilterKey, "prints">; label: string; options: Option[]; empty: string };

/** Островок с фильтрами: читает состояние из URL. */
export function CatalogListingIsland(props: Props) {
  const sp = useSearchParams();
  return <CatalogListing {...props} query={sp.toString()} />;
}

/** Листинг: строка фильтров, тулбар и сетка. Без query — статичный рендер (SSR/SEO). */
export function CatalogListing({ products, query: urlQuery = "" }: Props & { query?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  // Мгновенный отклик контролов, пока URL обновляется.
  const [query, setQuery] = useOptimistic(urlQuery);
  const filters = useMemo(() => parse(query), [query]);
  const list = useMemo(() => apply(products, filters), [products, filters]);
  const colors = useMemo(() => colorOptions(products), [products]);
  const groups = useMemo<Group[]>(
    () => [
      { key: "suppliers", label: "Поставщик", options: valueOptions(products, (p) => [p.supplier]), empty: "Нет данных о поставщиках в этом разделе" },
      { key: "materials", label: "Материал", options: valueOptions(products, (p) => p.materials), empty: "Нет данных о материалах в этом разделе" },
      { key: "colors", label: "Цвет", options: colors, empty: "Нет данных о цвете в этом разделе" },
      { key: "brands", label: "Бренд", options: valueOptions(products, (p) => [p.brand]), empty: "Нет данных о брендах в этом разделе" },
    ],
    [products, colors],
  );
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
  const listDropdown = (g: Group) => (
    <ListDropdown
      key={g.key}
      label={g.label}
      options={g.options}
      selected={filters[g.key]}
      onApply={(v) => update({ [g.key]: v })}
      emptyTitle={g.empty}
    />
  );

  const priceOn = filters.min != null || filters.max != null;

  return (
    <div>
      <div
        role="group"
        aria-label="Фильтры"
        className="no-scrollbar -mx-4 mb-4 flex items-center gap-2 overflow-x-auto px-4 py-1.5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
      >
        <CheckChip
          label="Новинки"
          checked={filters.isNew}
          onChange={(v) => update({ isNew: v })}
          disabled={!hasNew && !filters.isNew}
          title={!hasNew ? "Новинок в этом разделе пока нет" : undefined}
        />
        <CheckChip label="Акции" checked={false} onChange={() => {}} disabled title={OASIS_HINT} />
        <CheckChip label="В наличии" checked={filters.inStock} onChange={(v) => update({ inStock: v })} />
        <Dropdown label="Цена" count={priceOn ? 1 : 0}>
          <PricePopover min={filters.min} max={filters.max} onApply={(min, max) => update({ min, max })} />
        </Dropdown>
        {groups.slice(0, 3).map(listDropdown)}
        <Dropdown label="Вид нанесения" disabled title={OASIS_HINT} />
        {listDropdown(groups[3])}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p role="status" className="text-[13px] text-muted">
            Найдено <span className="font-semibold text-ink">{productsLabel(list.length)}</span>
          </p>
          {active ? (
            <button
              type="button"
              onClick={reset}
              className="text-[13px] font-medium text-brand underline-offset-2 hover:text-brand-hover hover:underline"
            >
              Сбросить всё
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[13px] font-medium text-ink hover:border-brand md:hidden"
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

      {sheet ? (
        <Drawer onClose={closeSheet} count={list.length}>
          <SheetFilters
            filters={filters}
            groups={groups}
            hasNew={hasNew}
            onChange={update}
            onReset={reset}
          />
        </Drawer>
      ) : null}
    </div>
  );
}

function ListDropdown({
  label,
  options,
  selected,
  onApply,
  emptyTitle,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onApply: (v: string[]) => void;
  emptyTitle: string;
}) {
  const empty = options.length === 0;
  return (
    <Dropdown label={label} count={selected.length} disabled={empty} title={empty ? emptyTitle : undefined}>
      <OptionsPopover name={label} options={options} selected={selected} onApply={onApply} />
    </Dropdown>
  );
}

function ProductGrid({ products }: { products: ListingProduct[] }) {
  const [shown, setShown] = useState(PAGE);
  const rest = products.length - shown;
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
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

/** Все группы фильтров для мобильного листа (применяются сразу). */
function SheetFilters({
  filters,
  groups,
  hasNew,
  onChange,
  onReset,
}: {
  filters: Filters;
  groups: Group[];
  hasNew: boolean;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const [min, setMin] = useState(filters.min?.toString() ?? "");
  const [max, setMax] = useState(filters.max?.toString() ?? "");
  const commitPrice = () => onChange({ min: min ? Number(min) : null, max: max ? Number(max) : null });
  const toggle = (key: Group["key"]) => (v: string, on: boolean) =>
    onChange({ [key]: on ? [...filters[key], v] : filters[key].filter((x) => x !== v) });
  const check = "flex items-center gap-2 text-[13px]";
  return (
    <div className="space-y-5">
      <fieldset onBlur={commitPrice}>
        <legend className="mb-2 text-[13px] font-semibold">Цена, ₽</legend>
        <PriceFields min={min} max={max} onMin={setMin} onMax={setMax} onEnter={commitPrice} />
      </fieldset>
      <div className="space-y-3">
        <label className={`${check} ${hasNew ? "cursor-pointer" : "text-faint"}`}>
          <input
            type="checkbox"
            checked={filters.isNew}
            disabled={!hasNew && !filters.isNew}
            onChange={(e) => onChange({ isNew: e.target.checked })}
            className="size-4 accent-brand"
          />
          Новинки
        </label>
        <label className={`${check} text-faint`} title={OASIS_HINT}>
          <input type="checkbox" disabled aria-disabled="true" className="size-4" />
          Акции
        </label>
        <label className={`${check} cursor-pointer`}>
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked })}
            className="size-4 accent-brand"
          />
          Только в наличии
        </label>
      </div>
      {groups.map((g) =>
        g.options.length ? (
          <fieldset key={g.key}>
            <legend className="mb-2 text-[13px] font-semibold">{g.label}</legend>
            <OptionList name={g.label} options={g.options} selected={filters[g.key]} onToggle={toggle(g.key)} />
          </fieldset>
        ) : null,
      )}
      <div aria-disabled="true" title={OASIS_HINT} className="text-[13px] text-faint">
        <p className="font-semibold">Вид нанесения</p>
        <p className="mt-0.5 text-[12px]">{OASIS_HINT}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-line text-[13px] font-medium text-ink hover:border-brand hover:text-brand"
      >
        Сбросить всё
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
    <div className="fixed inset-0 z-[60] md:hidden">
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

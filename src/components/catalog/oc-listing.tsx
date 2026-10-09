import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { ProductCard } from "@/components/catalog/product-card";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { buttonClass, selectClass } from "@/components/ui/button";
import { AutoSubmitSelect } from "./auto-submit";
import { SectionSidebar } from "./section-sidebar";
import { SectionSelect, type SectionLink } from "./section-select";
import { productsLabel } from "@/lib/format";
import type { Product } from "@/lib/catalog/types";
import type { Sort } from "@/server/catalog";

export type ListingQuery = { sort: Sort; page: number; priceFrom?: number; priceTo?: number; inStock: boolean; c?: string; q?: string };

const SORTS: { value: Sort; label: string }[] = [
  { value: "popular", label: "Популярные" },
  { value: "cheap", label: "Сначала дешевле" },
  { value: "expensive", label: "Сначала дороже" },
  { value: "stock", label: "Больше на складе" },
];

/** Разбор search params листинга. */
export function parseListing(sp: Record<string, string | string[] | undefined>): ListingQuery {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) as string | undefined;
  const num = (k: string) => {
    const v = Number(one(k));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };
  const sort = (one("sort") as Sort) ?? "popular";
  return {
    sort: SORTS.some((s) => s.value === sort) ? sort : "popular",
    page: Math.max(1, Math.min(500, Math.floor(num("page") ?? 1))),
    priceFrom: num("from"),
    priceTo: num("to"),
    inStock: one("stock") === "1",
    c: one("c"),
    q: one("q")?.slice(0, 100),
  };
}

function pageHref(path: string, q: ListingQuery, page: number) {
  const sp = new URLSearchParams();
  if (q.q) sp.set("q", q.q);
  if (q.c) sp.set("c", q.c);
  if (q.sort !== "popular") sp.set("sort", q.sort);
  if (q.priceFrom) sp.set("from", String(q.priceFrom));
  if (q.priceTo) sp.set("to", String(q.priceTo));
  if (q.inStock) sp.set("stock", "1");
  if (page > 1) sp.set("page", String(page));
  const s = sp.toString();
  return s ? `${path}?${s}` : path;
}

/** Листинг раздела/поиска: серверная выдача, фильтры — GET-форма. */
export function OcListing({
  title,
  crumbs,
  path,
  query,
  items,
  total,
  sections,
  chips,
  perPage = 24,
}: {
  title: string;
  crumbs: Crumb[];
  path: string;
  query: ListingQuery;
  items: Product[];
  total: number;
  sections?: SectionLink[];
  chips?: SectionLink[];
  perPage?: number;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const field = "h-10 w-full min-w-0 rounded-lg border border-line bg-white px-3 text-[14px] focus-visible:outline-2 focus-visible:outline-brand";
  const filters = (
    <form method="get" action={path} className="grid gap-4">
      {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
      {query.c ? <input type="hidden" name="c" value={query.c} /> : null}
      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold">Цена, ₽</legend>
        <div className="flex items-center gap-2">
          <input name="from" type="number" min={0} inputMode="numeric" placeholder="от" defaultValue={query.priceFrom} aria-label="Цена от" className={field} />
          <span aria-hidden="true" className="text-muted">—</span>
          <input name="to" type="number" min={0} inputMode="numeric" placeholder="до" defaultValue={query.priceTo} aria-label="Цена до" className={field} />
        </div>
      </fieldset>
      <label className="flex items-center gap-2.5 text-[14px]">
        <input type="checkbox" name="stock" value="1" defaultChecked={query.inStock} className="size-4 accent-[#D02E31]" />
        Только в наличии
      </label>
      <label className="grid gap-1.5 text-[13px] font-semibold">
        Сортировка
        <AutoSubmitSelect name="sort" defaultValue={query.sort} className={selectClass({ size: "sm" })}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </AutoSubmitSelect>
      </label>
      <div className="flex gap-2">
        <button type="submit" className={`${buttonClass({ size: "sm" })} flex-1`}>Показать</button>
        <Link href={pageHref(path, { sort: "popular", page: 1, inStock: false, q: query.q, c: query.c }, 1)} className={buttonClass({ variant: "outline", size: "sm" })}>
          Сбросить
        </Link>
      </div>
    </form>
  );

  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-4 text-[30px] font-bold leading-[1.12] tracking-tight md:text-[36px]">{title}</h1>
        <p className="mt-2 text-[14px] text-muted">{total ? `Найдено ${productsLabel(total)}` : "Ничего не найдено"}</p>
      </Container>

      <Container className="py-6 md:py-8">
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-8">
          <aside className="hidden lg:sticky lg:top-24 lg:grid lg:gap-6">
            {sections?.length ? <SectionSidebar items={sections} /> : null}
            <div className="rounded-[14px] bg-surface p-4">{filters}</div>
          </aside>
          <div className="min-w-0">
            <div className="mb-4 grid gap-3 lg:hidden">
              {sections?.length ? <SectionSelect items={sections} /> : null}
              <details className="rounded-[12px] bg-surface p-3 [&[open]>summary]:mb-3">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-[14px] font-semibold">
                  <SlidersHorizontal size={16} aria-hidden="true" /> Фильтры и сортировка
                </summary>
                {filters}
              </details>
            </div>
            {chips?.length ? (
              <ul className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
                {chips.map((c) => (
                  <li key={c.href} className="shrink-0">
                    <Link
                      href={c.href}
                      aria-current={c.active ? "page" : undefined}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium ${c.active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-brand hover:text-brand"}`}
                    >
                      {c.title}
                      {c.count ? <span className="tabular-nums opacity-60">{c.count}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {items.length ? (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 2xl:grid-cols-4">
                {items.map((p) => (
                  <li key={p.id}>
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-[14px] bg-surface px-6 py-12 text-center">
                <p className="text-[18px] font-semibold">Товары не найдены</p>
                <p className="mt-2 text-sm text-muted">Измените фильтры или напишите нам — подберём товары под задачу.</p>
              </div>
            )}
            {pages > 1 ? (
              <nav aria-label="Страницы" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
                {query.page > 1 ? <Link href={pageHref(path, query, query.page - 1)} className="h-10 rounded-lg border border-line px-3 leading-10 hover:border-brand">←</Link> : null}
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === pages || Math.abs(n - query.page) <= 2)
                  .map((n, i, arr) => (
                    <span key={n} className="flex items-center gap-1.5">
                      {i > 0 && n - arr[i - 1] > 1 ? <span className="px-1 text-muted">…</span> : null}
                      <Link
                        href={pageHref(path, query, n)}
                        aria-current={n === query.page ? "page" : undefined}
                        className={`h-10 min-w-10 rounded-lg border px-3 text-center leading-10 tabular-nums ${n === query.page ? "border-ink bg-ink text-white" : "border-line hover:border-brand"}`}
                      >
                        {n}
                      </Link>
                    </span>
                  ))}
                {query.page < pages ? <Link href={pageHref(path, query, query.page + 1)} className="h-10 rounded-lg border border-line px-3 leading-10 hover:border-brand">→</Link> : null}
              </nav>
            ) : null}
          </div>
        </div>
      </Container>
      {items.length ? null : <ConsultationCta />}
    </main>
  );
}

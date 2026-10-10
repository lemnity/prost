import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { ProductGrid } from "./product-grid";
import type { ListRequest } from "@/app/api/catalog/list/route";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { buttonClass, selectClass } from "@/components/ui/button";
import { AutoSubmitCheckbox, AutoSubmitSelect } from "./auto-submit";
import { X } from "lucide-react";
import { FACETS, type FacetKind } from "@/lib/catalog/facets";
import type { FacetCounts } from "@/server/catalog";
import { SectionSidebar } from "./section-sidebar";
import { SectionSelect, type SectionLink } from "./section-select";
import { productsLabel } from "@/lib/format";
import type { Product } from "@/lib/catalog/types";
import type { Sort } from "@/server/catalog";

export type ListingQuery = { sort: Sort; page: number; priceFrom?: number; priceTo?: number; inStock: boolean; isNew?: boolean; facets?: Partial<Record<FacetKind, string[]>>; c?: string; q?: string };

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
  const all = (k: string) => [sp[k] ?? []].flat().filter((v): v is string => typeof v === "string" && /^[a-z0-9-]{1,32}$/.test(v)).slice(0, 20);
  const facets = Object.fromEntries(FACETS.map((f) => [f.kind, all(f.param)]).filter(([, v]) => v.length));
  return {
    sort: SORTS.some((s) => s.value === sort) ? sort : "popular",
    page: Math.max(1, Math.min(500, Math.floor(num("page") ?? 1))),
    priceFrom: num("from"),
    priceTo: num("to"),
    inStock: one("stock") === "1",
    isNew: one("new") === "1",
    facets,
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
  if (q.isNew) sp.set("new", "1");
  for (const f of FACETS) for (const v of q.facets?.[f.kind] ?? []) sp.append(f.param, v);
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
  facets,
  request,
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
  facets?: FacetCounts;
  /** Раздел/подборка/поиск — для догрузки следующих страниц. */
  request: Pick<ListRequest, "category" | "collection" | "q">;
  perPage?: number;
}) {
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
        <AutoSubmitCheckbox name="stock" value="1" defaultChecked={query.inStock} className="size-4 accent-[#D02E31]" />
        Только в наличии
      </label>
      {facets && (facets.isNew > 0 || query.isNew) ? (
        <label className="-mt-2 flex items-center gap-2.5 text-[14px]">
          <AutoSubmitCheckbox name="new" value="1" defaultChecked={query.isNew} className="size-4 accent-[#D02E31]" />
          Новинки <span className="tabular-nums text-muted">{facets.isNew}</span>
        </label>
      ) : null}
      {facets
        ? FACETS.map((g) => {
            const counts = new Map(facets[g.kind].map((r) => [r.value, r.n]));
            const chosen = query.facets?.[g.kind] ?? [];
            // Цвета — в порядке палитры, материалы и нанесение — самые частые в разделе сверху.
            const options = g.tags
              .filter((t) => counts.has(t.id) || chosen.includes(t.id))
              .sort((a, b) => (g.kind === "c" ? 0 : (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)));
            if (!options.length) return null;
            const row = (t: (typeof options)[number]) => (
              <label key={t.id} className="flex items-center gap-2.5 py-1 text-[14px]">
                <AutoSubmitCheckbox name={g.param} value={t.id} defaultChecked={chosen.includes(t.id)} className="size-4 shrink-0 accent-[#D02E31]" />
                {"swatch" in t && t.swatch ? <span aria-hidden="true" className="size-3.5 shrink-0 rounded-full ring-1 ring-black/15" style={{ background: t.swatch }} /> : null}
                <span className="min-w-0 flex-1 first-letter:uppercase">{t.label}</span>
                <span className="tabular-nums text-[12px] text-muted">{counts.get(t.id) ?? 0}</span>
              </label>
            );
            const head = options.slice(0, 7), more = options.slice(7);
            return (
              <fieldset key={g.kind} className="border-t border-line pt-3">
                <legend className="mb-1 text-[13px] font-semibold">{g.label}</legend>
                {head.map(row)}
                {more.length ? (
                  <details open={more.some((t) => chosen.includes(t.id))} className="[&[open]>summary]:hidden">
                    <summary className="cursor-pointer list-none py-1 text-[13px] font-medium text-brand">Ещё {more.length}</summary>
                    {more.map(row)}
                  </details>
                ) : null}
              </fieldset>
            );
          })
        : null}
      {/* На lg сортировка — справа от заголовка; здесь скрыта, но значение уходит с формой. */}
      <label className="grid gap-1.5 text-[13px] font-semibold lg:hidden">
        Сортировка
        <AutoSubmitSelect name="sort" defaultValue={query.sort} className={selectClass({ size: "sm" })}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </AutoSubmitSelect>
      </label>
      {/* Кнопки прилипают к низу прокручиваемой колонки фильтров. */}
      <div className="flex gap-2 lg:sticky lg:bottom-0 lg:z-10 lg:-mx-4 lg:-mb-4 lg:rounded-b-[14px] lg:border-t lg:border-line lg:bg-surface lg:px-4 lg:pb-4 lg:pt-3">
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
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-[30px] font-bold leading-[1.12] tracking-tight md:text-[36px]">{title}</h1>
            <p className="mt-2 text-[14px] text-muted">{total ? `Найдено ${productsLabel(total)}` : "Ничего не найдено"}</p>
          </div>
          {total ? (
            <form method="get" action={path} className="hidden items-center gap-3 lg:flex">
              {[...new URLSearchParams(pageHref(path, { ...query, sort: "popular" }, 1).split("?")[1] ?? "")].map(([k, v], i) => (
                <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
              ))}
              <label htmlFor="listing-sort" className="text-[14px] text-muted">Сортировка</label>
              <AutoSubmitSelect id="listing-sort" name="sort" defaultValue={query.sort} className={`${selectClass({ size: "sm" })} min-w-[200px]`}>
                {SORTS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </AutoSubmitSelect>
              <noscript>
                <button type="submit" className={buttonClass({ variant: "outline", size: "sm" })}>OK</button>
              </noscript>
            </form>
          ) : null}
        </div>
      </Container>

      <Container className="pb-6 pt-4 md:pb-8 md:pt-5">
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-8">
          {/* Колонка по высоте экрана под липкой шапкой; длинные фильтры прокручиваются внутри. */}
          <aside className="hidden lg:sticky lg:top-24 lg:grid lg:max-h-[calc(100dvh/var(--zoom)-7.5rem)] lg:gap-6 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:[scrollbar-gutter:stable] lg:[scrollbar-width:thin]">
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
            {(() => {
              const active = FACETS.flatMap((g) =>
                (query.facets?.[g.kind] ?? []).map((v) => ({
                  key: `${g.kind}-${v}`,
                  label: g.tags.find((t) => t.id === v)?.label ?? v,
                  href: pageHref(path, { ...query, facets: { ...query.facets, [g.kind]: query.facets![g.kind]!.filter((x) => x !== v) } }, 1),
                })),
              );
              if (query.isNew) active.unshift({ key: "new", label: "Новинки", href: pageHref(path, { ...query, isNew: false }, 1) });
              if (query.inStock) active.unshift({ key: "stock", label: "В наличии", href: pageHref(path, { ...query, inStock: false }, 1) });
              return active.length ? (
                <ul aria-label="Выбранные фильтры" className="mb-4 flex flex-wrap gap-2">
                  {active.map((a) => (
                    <li key={a.key}>
                      <Link href={a.href} className="inline-flex h-8 items-center gap-1 rounded-full bg-surface pl-3 pr-2 text-[13px] first-letter:uppercase hover:text-brand">
                        {a.label} <X size={14} aria-label="убрать" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null;
            })()}
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
              <ProductGrid
                key={pageHref(path, query, query.page)}
                initial={items}
                total={total}
                page={query.page}
                perPage={perPage}
                request={{ ...request, q: request.q ?? query.q, priceFrom: query.priceFrom, priceTo: query.priceTo, inStock: query.inStock, isNew: query.isNew, facets: query.facets, sort: query.sort }}
                nextHref={pageHref(path, query, query.page + 1)}
              />
            ) : (
              <div className="rounded-[14px] bg-surface px-6 py-12 text-center">
                <p className="text-[18px] font-semibold">Товары не найдены</p>
                <p className="mt-2 text-sm text-muted">Измените фильтры или напишите нам — подберём товары под задачу.</p>
              </div>
            )}
          </div>
        </div>
      </Container>
      {items.length ? null : <ConsultationCta />}
    </main>
  );
}

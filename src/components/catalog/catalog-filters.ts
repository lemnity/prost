// Модель фильтров листинга: состояние в URL, AND между группами, OR внутри группы.
import type { ListingProduct } from "@/lib/catalog/types";
import { COLOR_TAGS } from "@/lib/catalog/colors";

export const SORTS = [
  { id: "popular", label: "Популярные" },
  { id: "price-asc", label: "Сначала дешёвые" },
  { id: "price-desc", label: "Сначала дорогие" },
  { id: "stock", label: "По наличию" },
] as const;
export type Sort = (typeof SORTS)[number]["id"];

export type Filters = {
  sort: Sort;
  min: number | null;
  max: number | null;
  inStock: boolean;
  isNew: boolean;
  /** Акции — появятся с Oasis. */
  promo: boolean;
  /** Поставщик (поле brand выгрузки). */
  brands: string[];
  colors: string[];
  /** Материал, вид нанесения, бренд — появятся с Oasis. */
  materials: string[];
  prints: string[];
  brands2: string[];
};

export type ListFilterKey = "brands" | "colors" | "materials" | "prints" | "brands2";

// Имена параметров URL.
const LIST_PARAMS: Record<ListFilterKey, string> = {
  brands: "brand",
  colors: "color",
  materials: "material",
  prints: "print",
  brands2: "brand2",
};

export const EMPTY_FILTERS: Omit<Filters, "sort"> = {
  min: null,
  max: null,
  inStock: false,
  isNew: false,
  promo: false,
  brands: [],
  colors: [],
  materials: [],
  prints: [],
  brands2: [],
};

export function num(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parse(query: string): Filters {
  const sp = new URLSearchParams(query);
  const sort = sp.get("sort");
  const f: Filters = {
    ...EMPTY_FILTERS,
    sort: SORTS.some((s) => s.id === sort) ? (sort as Sort) : "popular",
    min: num(sp.get("min")),
    max: num(sp.get("max")),
    inStock: sp.get("stock") === "1",
    isNew: sp.get("new") === "1",
    promo: sp.get("promo") === "1",
  };
  for (const k of Object.keys(LIST_PARAMS) as ListFilterKey[]) f[k] = sp.getAll(LIST_PARAMS[k]);
  return f;
}

export function serialize(f: Filters): string {
  const sp = new URLSearchParams();
  if (f.sort !== "popular") sp.set("sort", f.sort);
  if (f.min != null) sp.set("min", String(f.min));
  if (f.max != null) sp.set("max", String(f.max));
  if (f.inStock) sp.set("stock", "1");
  if (f.isNew) sp.set("new", "1");
  if (f.promo) sp.set("promo", "1");
  for (const k of Object.keys(LIST_PARAMS) as ListFilterKey[]) {
    for (const v of f[k]) sp.append(LIST_PARAMS[k], v);
  }
  return sp.toString();
}

const anyOf = (selected: string[], values: string[] | undefined) =>
  selected.length === 0 || (values ?? []).some((v) => selected.includes(v));

export function apply(products: ListingProduct[], f: Filters): ListingProduct[] {
  const list = products.filter(
    (p) =>
      (f.min == null || p.priceFrom >= f.min) &&
      (f.max == null || p.priceFrom <= f.max) &&
      (!f.inStock || p.stock > 0) &&
      (!f.isNew || !!p.isNew) &&
      (!f.promo || !!p.promo) &&
      anyOf(f.brands, [p.brand]) &&
      anyOf(f.colors, p.colors) &&
      anyOf(f.materials, p.materials) &&
      anyOf(f.prints, p.prints) &&
      anyOf(f.brands2, p.brand2 ? [p.brand2] : []),
  );
  if (f.sort === "price-asc") list.sort((a, b) => a.priceFrom - b.priceFrom);
  else if (f.sort === "price-desc") list.sort((a, b) => b.priceFrom - a.priceFrom);
  else if (f.sort === "stock") list.sort((a, b) => b.stock - a.stock);
  return list;
}

/** Количество активных групп/значений (для бейджа «Фильтры»). */
export function activeCount(f: Filters): number {
  return (
    (f.min != null || f.max != null ? 1 : 0) +
    (f.inStock ? 1 : 0) +
    (f.isNew ? 1 : 0) +
    (f.promo ? 1 : 0) +
    f.brands.length +
    f.colors.length +
    f.materials.length +
    f.prints.length +
    f.brands2.length
  );
}

export type Option = { value: string; label: string; count: number; swatch?: string };

export function colorOptions(products: ListingProduct[]): Option[] {
  const counts = new Map<string, number>();
  for (const p of products) for (const c of p.colors) counts.set(c, (counts.get(c) ?? 0) + 1);
  return COLOR_TAGS.filter((c) => counts.has(c.id)).map((c) => ({
    value: c.id,
    label: c.label,
    count: counts.get(c.id)!,
    swatch: c.swatch,
  }));
}

export function brandOptions(products: ListingProduct[], brands: string[]): Option[] {
  return brands.map((b) => ({ value: b, label: b, count: products.filter((p) => p.brand === b).length }));
}

export const OASIS_HINT = "Появится после подключения склада Oasis";

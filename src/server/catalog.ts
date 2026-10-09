import { json, query, type Row } from "./db";
import { productHref } from "@/lib/catalog/oasis-tree";
import type { Product } from "@/lib/catalog/types";
import type { FacetKind } from "@/lib/catalog/facets";

type Img = { big?: string; superbig?: string; small?: string; thumbnail?: string };
type Attr = { name: string; value: string; dim?: string };
type Color = { name: string };

export type OcRow = Row & {
  id: string;
  supplier: string;
  article: string;
  group_id: string | null;
  color_group_id: string | null;
  slug: string;
  name: string;
  full_name: string | null;
  cover: string | null;
  /** Поля из oc_product_details — есть только у строк, прочитанных через DETAIL. */
  description?: string | null;
  price: string;
  old_price: string | null;
  rating: number;
  size: string | null;
  colors: unknown;
  attributes?: unknown;
  images?: unknown;
  primary_cat: number | null;
  stock: number;
  remote: number;
  deleted: number;
};

export const imagesOf = (r: OcRow) => (json<Img[]>(r.images) ?? []).map((i) => i.superbig || i.big || i.small || "").filter(Boolean);
export const coverOf = (r: OcRow) => {
  if (r.cover) return r.cover;
  const i = (json<Img[]>(r.images) ?? [])[0];
  return i?.big || i?.superbig || i?.small || "";
};
export const attrsOf = (r: OcRow) => json<Attr[]>(r.attributes) ?? [];
export const colorOf = (r: OcRow) => (json<Color[]>(r.colors) ?? []).map((c) => c.name).filter(Boolean).join(", ");
export const urlOf = (r: OcRow) => productHref(r.primary_cat, r.slug, r.id);

/** Карточка каталога из строки базы. */
export function toProduct(r: OcRow): Product {
  const total = r.stock + r.remote;
  const old = r.old_price ? Number(r.old_price) : 0;
  return {
    id: r.id,
    title: r.name,
    sku: r.article,
    priceFrom: Number(r.price),
    ...(old > Number(r.price) ? { oldPrice: old } : {}),
    currency: "RUB",
    image: coverOf(r),
    url: urlOf(r),
    stock: r.deleted ? 0 : total,
    ...(total === 0 ? { preorder: true } : {}),
  };
}

export type Sort = "popular" | "cheap" | "expensive" | "stock" | "new";
export type ListParams = { category?: number; q?: string; /** Подборка: название содержит любое из слов или товар в одном из разделов. */ theme?: { words: string[]; cats: number[] }; priceFrom?: number; priceTo?: number; inStock?: boolean; sale?: boolean; isNew?: boolean;
  /** Фильтры по меткам: внутри группы — ИЛИ, между группами — И. */
  facets?: Partial<Record<FacetKind, string[]>>;
  sort?: Sort; page?: number; perPage?: number };

const ORDER: Record<Sort, string> = {
  popular: "(stock + remote > 0) DESC, rating DESC, id",
  cheap: "price ASC, id",
  expensive: "price DESC, id",
  stock: "(stock + remote) DESC, id",
  new: "is_new DESC, (supplier = 'oasis') DESC, id DESC",
};

type Listing = { items: Product[]; total: number };

/** Кэш выдачи на 10 минут: склад обновляется раз в час, а запрос по всему каталогу тяжёлый для слабого сервера. */
const CACHE_MS = 10 * 60_000;
const cache = new Map<string, { at: number; value: Promise<Listing> }>();

/** Список товаров раздела/поиска: одна карточка на модель (color_group_id). */
export function listProducts(p: ListParams): Promise<Listing> {
  const key = JSON.stringify(p);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  if (cache.size > 500) cache.clear();
  const value = queryListing(p);
  cache.set(key, { at: Date.now(), value });
  value.catch(() => cache.delete(key));
  return value;
}

/** Условия выборки; skip — группа меток, которую не учитываем (для счётчиков этой же группы). */
function whereOf(p: ListParams, skip?: FacetKind) {
  const where = ["p.deleted = 0"];
  const args: unknown[] = [];
  let join = "";
  if (p.category) {
    join = "JOIN oc_product_categories pc ON pc.product_id = p.id AND pc.category_id = ?";
    args.push(p.category);
  }
  if (p.theme) {
    const or = p.theme.words.map(() => "p.name LIKE ?");
    args.push(...p.theme.words.map((w) => `%${w}%`));
    if (p.theme.cats.length) {
      or.push(`EXISTS (SELECT 1 FROM oc_product_categories t WHERE t.product_id = p.id AND t.category_id IN (${p.theme.cats.map(() => "?").join(",")}))`);
      args.push(...p.theme.cats);
    }
    where.push(`(${or.join(" OR ")})`);
  }
  if (p.q) {
    const words = p.q.trim().split(/\s+/).filter(Boolean).slice(0, 6);
    for (const w of words) {
      where.push("(p.name LIKE ? OR p.article LIKE ?)");
      args.push(`%${w}%`, `${w}%`);
    }
  }
  if (p.priceFrom) {
    where.push("p.price >= ?");
    args.push(p.priceFrom);
  }
  if (p.priceTo) {
    where.push("p.price <= ?");
    args.push(p.priceTo);
  }
  if (p.inStock) where.push("p.stock + p.remote > 0");
  if (p.sale) where.push("p.old_price > p.price");
  if (p.isNew) where.push("p.is_new = 1");
  for (const [kind, values] of Object.entries(p.facets ?? {}) as [FacetKind, string[]][]) {
    if (kind === skip || !values?.length) continue;
    where.push("EXISTS (SELECT 1 FROM oc_product_facets f WHERE f.product_id = p.id AND f.kind = ? AND f.value IN (?))");
    args.push(kind, values);
  }
  return { base: `FROM oc_products p ${join} WHERE ${where.join(" AND ")}`, args };
}

async function queryListing(p: ListParams): Promise<Listing> {
  const { base, args } = whereOf(p);
  const perPage = Math.min(60, p.perPage ?? 24);
  const page = Math.max(1, p.page ?? 1);
  const [cnt] = await query<Row & { n: number }>(`SELECT COUNT(DISTINCT COALESCE(p.color_group_id, p.id)) n ${base}`, args);
  const rows = await query<OcRow>(
    `SELECT * FROM (
       SELECT p.*, ROW_NUMBER() OVER (PARTITION BY COALESCE(p.color_group_id, p.id) ORDER BY (p.stock + p.remote > 0) DESC, p.rating DESC, p.id) rn ${base}
     ) x WHERE rn = 1 ORDER BY ${ORDER[p.sort ?? "popular"]} LIMIT ? OFFSET ?`,
    [...args, perPage, (page - 1) * perPage],
  );
  return { items: rows.map(toProduct), total: Number(cnt?.n ?? 0) };
}

export type FacetCounts = Record<FacetKind, { value: string; n: number }[]> & { isNew: number };
const facetCache = new Map<string, { at: number; value: Promise<FacetCounts> }>();

/** Счётчики фильтров раздела: для каждой группы — с учётом остальных выбранных фильтров. */
export function listFacets(p: ListParams): Promise<FacetCounts> {
  const key = JSON.stringify({ ...p, sort: undefined, page: undefined, perPage: undefined });
  const hit = facetCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  if (facetCache.size > 500) facetCache.clear();
  const value = (async () => {
    const out = { isNew: 0 } as FacetCounts;
    for (const kind of ["c", "m", "p"] as FacetKind[]) {
      const { base, args } = whereOf(p, kind);
      out[kind] = (
        await query<Row & { value: string; n: number }>(
          `SELECT f.value, COUNT(DISTINCT COALESCE(p.color_group_id, p.id)) n ${base.replace("FROM oc_products p", "FROM oc_products p JOIN oc_product_facets f ON f.product_id = p.id AND f.kind = ?")} GROUP BY f.value`,
          [kind, ...args],
        )
      ).map((r) => ({ value: r.value, n: Number(r.n) }));
    }
    const { base, args } = whereOf({ ...p, isNew: true });
    const [nw] = await query<Row & { n: number }>(`SELECT COUNT(DISTINCT COALESCE(p.color_group_id, p.id)) n ${base}`, args);
    out.isNew = Number(nw?.n ?? 0);
    return out;
  })();
  facetCache.set(key, { at: Date.now(), value });
  value.catch(() => facetCache.delete(key));
  return value;
}

/** Выдача и счётчики фильтров одним вызовом (запросы идут параллельно). */
export async function listWithFacets(p: ListParams): Promise<Listing & { facets: FacetCounts }> {
  const [list, facets] = await Promise.all([listProducts(p), listFacets(p)]);
  return { ...list, facets };
}

/** Товар со всеми полями (описание, характеристики, фото). */
const DETAIL = "SELECT p.*, d.description, d.attributes, d.images FROM oc_products p LEFT JOIN oc_product_details d ON d.id = p.id";

export async function getProductRow(id: string): Promise<OcRow | null> {
  const [r] = await query<OcRow>(`${DETAIL} WHERE p.id = ? LIMIT 1`, [id]);
  return r ?? null;
}

/** Все цвета и размеры модели. */
export async function modelRows(r: OcRow): Promise<OcRow[]> {
  if (!r.color_group_id && !r.group_id) return [r];
  return query<OcRow>(
    `${DETAIL} WHERE p.deleted = 0 AND (p.color_group_id = ? OR p.group_id = ?) ORDER BY p.group_id, p.size, p.id LIMIT 300`,
    [r.color_group_id ?? r.id, r.group_id ?? r.id],
  );
}

export async function similarProducts(r: OcRow, limit = 8): Promise<Product[]> {
  if (!r.primary_cat) return [];
  const { items } = await listProducts({ category: r.primary_cat, perPage: limit + 4, inStock: true });
  return items.filter((p) => p.id !== r.id && p.sku !== r.article).slice(0, limit);
}

/** Поиск товара Oasis по артикулу (переадресация со старых страниц). */
export async function rowByArticle(article: string): Promise<OcRow | null> {
  const [r] = await query<OcRow>("SELECT * FROM oc_products WHERE article = ? AND deleted = 0 LIMIT 1", [article]);
  return r ?? null;
}

export type DayPick = { title: string; image: string; url: string; priceFrom: number };
let dayCache: { day: string; value: Promise<Record<number, DayPick>> } | null = null;

/** «Товар дня» для разделов меню: случайный на сутки (по Москве) товар с фото, которого много на складе. */
export function productsOfDay(categoryIds: number[]): Promise<Record<number, DayPick>> {
  const day = new Date().toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow" });
  if (dayCache?.day === day) return dayCache.value;
  const value = (async () => {
    if (!categoryIds.length) return {};
    const rows = await query<OcRow & { category_id: number }>(
      `SELECT * FROM (
         SELECT pc.category_id, p.*, ROW_NUMBER() OVER (PARTITION BY pc.category_id ORDER BY CRC32(CONCAT(p.id, ?))) rn
         FROM oc_product_categories pc
         JOIN oc_products p ON p.id = pc.product_id AND p.deleted = 0 AND p.cover IS NOT NULL AND p.price > 0 AND p.stock + p.remote >= 50
         WHERE pc.category_id IN (?)
       ) x WHERE rn <= 5 ORDER BY category_id, rn`,
      [day, categoryIds],
    );
    // Разделы пересекаются (наборы, коллекции) — один товар не показываем дважды.
    const used = new Set<string>();
    const out: Record<number, DayPick> = {};
    for (const id of categoryIds) {
      const r = rows.find((x) => x.category_id === id && !used.has(x.color_group_id ?? x.id));
      if (!r) continue;
      used.add(r.color_group_id ?? r.id);
      out[id] = { title: r.name.trim(), image: coverOf(r), url: urlOf(r), priceFrom: Number(r.price) };
    }
    return out;
  })();
  dayCache = { day, value };
  value.catch(() => (dayCache = null));
  return value;
}

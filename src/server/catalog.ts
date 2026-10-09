import { json, query, type Row } from "./db";
import { productHref } from "@/lib/catalog/oasis-tree";
import type { Product } from "@/lib/catalog/types";

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
  description: string | null;
  price: string;
  old_price: string | null;
  rating: number;
  size: string | null;
  colors: unknown;
  attributes: unknown;
  images: unknown;
  primary_cat: number | null;
  stock: number;
  remote: number;
  deleted: number;
};

export const imagesOf = (r: OcRow) => (json<Img[]>(r.images) ?? []).map((i) => i.superbig || i.big || i.small || "").filter(Boolean);
export const coverOf = (r: OcRow) => {
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
export type ListParams = { category?: number; q?: string; /** Подборка: название содержит любое из слов или товар в одном из разделов. */ theme?: { words: string[]; cats: number[] }; priceFrom?: number; priceTo?: number; inStock?: boolean; sale?: boolean; sort?: Sort; page?: number; perPage?: number };

const ORDER: Record<Sort, string> = {
  popular: "(stock + remote > 0) DESC, rating DESC, id",
  cheap: "price ASC, id",
  expensive: "price DESC, id",
  stock: "(stock + remote) DESC, id",
  new: "id DESC",
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

async function queryListing(p: ListParams): Promise<Listing> {
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
  const base = `FROM oc_products p ${join} WHERE ${where.join(" AND ")}`;
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

export async function getProductRow(id: string): Promise<OcRow | null> {
  const [r] = await query<OcRow>("SELECT * FROM oc_products WHERE id = ? LIMIT 1", [id]);
  return r ?? null;
}

/** Все цвета и размеры модели. */
export async function modelRows(r: OcRow): Promise<OcRow[]> {
  if (!r.color_group_id && !r.group_id) return [r];
  return query<OcRow>(
    "SELECT * FROM oc_products WHERE deleted = 0 AND (color_group_id = ? OR group_id = ?) ORDER BY group_id, size, id LIMIT 300",
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

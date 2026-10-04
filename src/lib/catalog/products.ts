// Шов каталога: сейчас источник — выгрузка товаров с prostyle.gifts
// (src/data/catalog-products.json). Позже провайдер склада (Oasis) заменит
// источник, не меняя сигнатуры функций и страниц.
import raw from "@/data/catalog-products.json";
import { catalogTree, newProducts, newYearPicks, saleProducts } from "./static-data";
import { deriveColors } from "./colors";
import type { CatalogNode, Product } from "./types";

export type ProductVariant = {
  title: string;
  sku: string | null;
  stock: number;
  url: string;
  image: string;
};

export type CatalogProduct = {
  id: string;
  url: string;
  category: string;
  subcategory: string | null;
  title: string;
  sku: string;
  price: number;
  /** Цена до скидки (распродажа). */
  oldPrice?: number;
  stock: number;
  brand: string;
  isNew: boolean;
  image: string;
  popularity: number;
  variants: ProductVariant[];
  /** Нормализованные цвета (id из COLOR_TAGS), вычисляются при загрузке. */
  colors: string[];
};

/** Виртуальные подборки из навигации (не входят в дерево категорий). */
export const collections = {
  new: { title: "Новинки" },
  hits: { title: "Хиты" },
  sale: { title: "Распродажа" },
} as const;
export type CollectionId = keyof typeof collections;

// Подкатегории, которые есть в данных, но не в дереве меню.
const extraSubTitles: Record<string, string> = {
  "suveniry-k-prazdnikam/den-aviacii": "День авиации",
  "suveniry-k-prazdnikam/podarki-na-den-rossii": "Подарки на День России",
  "upakovka/podarochnaya-upakovka": "Подарочная упаковка",
};

const HITS_PER_CATEGORY = 2;

function splitUrl(url: string) {
  const parts = url.split("/").filter(Boolean); // catalog, cat, [sub], item-…
  const item = parts[parts.length - 1];
  return {
    category: parts[1],
    subcategory: parts.length === 4 ? parts[2] : null,
    item,
  };
}

function fromStatic(p: Product, popularity: number): CatalogProduct {
  const { category, subcategory } = splitUrl(p.url);
  return {
    id: p.id,
    url: p.url,
    category,
    subcategory,
    title: p.title,
    sku: p.sku,
    price: p.priceFrom,
    oldPrice: p.oldPrice,
    stock: p.stock,
    brand: "",
    isNew: !!p.isNew,
    image: p.image,
    popularity,
    variants: [],
    colors: [],
  };
}

let cache: CatalogProduct[] | null = null;

function load(): CatalogProduct[] {
  if (cache) return cache;
  const list = (raw as unknown as CatalogProduct[]).map((p) => ({ ...p }));
  const byUrl = new Map(list.map((p) => [p.url, p]));
  // Товары с главной (новинки, распродажа, новогодняя подборка): дополняем
  // флаги у совпавших и добавляем отсутствующие в выгрузке.
  for (const s of [...newProducts, ...saleProducts, ...newYearPicks]) {
    const found = byUrl.get(s.url);
    if (found) {
      if (s.isNew) found.isNew = true;
      if (s.oldPrice) {
        found.oldPrice = s.oldPrice;
        found.price = s.priceFrom;
      }
    } else {
      const p = fromStatic(s, list.length + 1);
      list.push(p);
      byUrl.set(p.url, p);
    }
  }
  for (const p of list) p.colors = deriveColors([p.title, ...p.variants.map((v) => v.title)]);
  cache = list;
  return list;
}

const byPopularity = (a: CatalogProduct, b: CatalogProduct) => a.popularity - b.popularity;

export function getAllProducts(): CatalogProduct[] {
  return load();
}

export function getProductsByCategory(category: string, sub?: string | null): CatalogProduct[] {
  return load()
    .filter((p) => p.category === category && (sub == null || p.subcategory === sub))
    .sort(byPopularity);
}

export function getCollectionProducts(id: CollectionId): CatalogProduct[] {
  const all = [...load()].sort(byPopularity);
  if (id === "new") return all.filter((p) => p.isNew);
  if (id === "sale") return all.filter((p) => p.oldPrice);
  // Хиты: самые популярные товары каждой категории.
  const seen = new Map<string, number>();
  return all.filter((p) => {
    const n = seen.get(p.category) ?? 0;
    if (n >= HITS_PER_CATEGORY || p.stock <= 0) return false;
    seen.set(p.category, n + 1);
    return true;
  });
}

export function isCollection(id: string): id is CollectionId {
  return Object.hasOwn(collections, id);
}

export function getProductByPath(
  category: string,
  sub: string | null,
  item: string,
): CatalogProduct | null {
  const url = sub ? `/catalog/${category}/${sub}/${item}` : `/catalog/${category}/${item}`;
  return load().find((p) => p.url === url) ?? null;
}

export function getProductByUrl(url: string): CatalogProduct | null {
  return load().find((p) => p.url === url) ?? null;
}

export function getBrands(products: CatalogProduct[]): string[] {
  const set = new Set<string>();
  for (const p of products) if (p.brand.trim()) set.add(p.brand.trim());
  return [...set].sort((a, b) => a.localeCompare(b, "ru"));
}

export function getCategoryNode(category: string): CatalogNode | null {
  return catalogTree.find((c) => c.id === category) ?? null;
}

export type SubcategoryInfo = { slug: string; title: string; href: string; count: number };

/** Подкатегории: из дерева меню + встречающиеся в данных. */
export function getSubcategories(category: string): SubcategoryInfo[] {
  const node = getCategoryNode(category);
  const counts = new Map<string, number>();
  for (const p of load()) {
    if (p.category === category && p.subcategory) {
      counts.set(p.subcategory, (counts.get(p.subcategory) ?? 0) + 1);
    }
  }
  const out: SubcategoryInfo[] = (node?.children ?? []).map((c) => {
    const slug = c.href.split("/").filter(Boolean)[2];
    return { slug, title: c.title, href: c.href, count: counts.get(slug) ?? 0 };
  });
  for (const [slug, count] of counts) {
    if (!out.some((s) => s.slug === slug)) {
      out.push({
        slug,
        title: extraSubTitles[`${category}/${slug}`] ?? slug,
        href: `/catalog/${category}/${slug}`,
        count,
      });
    }
  }
  return out;
}

export function countByCategory(category: string): number {
  return load().filter((p) => p.category === category).length;
}

/** Похожие товары: та же подкатегория, при нехватке — та же категория. */
export function getSimilarProducts(product: CatalogProduct, limit = 8): CatalogProduct[] {
  const same = getProductsByCategory(product.category, product.subcategory).filter(
    (p) => p.url !== product.url && p.id !== product.id,
  );
  if (same.length < 4) {
    const ids = new Set([product.id, ...same.map((p) => p.id)]);
    for (const p of getProductsByCategory(product.category)) {
      if (same.length >= limit) break;
      if (!ids.has(p.id)) {
        same.push(p);
        ids.add(p.id);
      }
    }
  }
  return same.slice(0, limit);
}

/** Преобразование в тип карточки товара (ProductCard). */
export function toCard(p: CatalogProduct): Product {
  return {
    id: p.id,
    title: p.title,
    sku: p.sku,
    priceFrom: p.price,
    oldPrice: p.oldPrice,
    currency: "RUB",
    image: p.image,
    url: p.url,
    stock: p.stock,
    isNew: p.isNew,
  };
}

export { splitUrl };

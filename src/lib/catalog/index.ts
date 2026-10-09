// Дерево каталога — единое (основа Oasis), из снимка src/data/oasis-tree.json; подборки главной — статические.
import { newProducts, saleProducts, newYearPicks, popularCategories } from "./static-data";
import { topCategories, topNodes } from "./oasis-tree";
import type { CatalogNode, Category, Product } from "./types";

export type { CatalogNode, Category, Product } from "./types";

/** Новинки поставщиков в наличии (как на /catalog/new). При сборке базы нет — запасной статический список. */
export async function getNewProducts(limit = 6): Promise<Product[]> {
  try {
    const { listProducts } = await import("@/server/catalog");
    const { items } = await listProducts({ sort: "new", inStock: true, perPage: limit });
    if (items.length) return items;
  } catch {
    // нет DATABASE_URL (сборка) или база недоступна
  }
  return newProducts.slice(0, limit);
}

export async function getWeeklySale(limit = 6): Promise<Product[]> {
  return saleProducts.slice(0, limit);
}

/** Сезонные плитки главной: новогодняя (с отсчётом) и праздничная (ближайшие праздники). */
const SEASONAL = [
  { ...popularCategories[0], count: 0 },
  { ...popularCategories[1], href: "/catalog/prazdniki", count: 0 },
];

/** Плитки главной: 2 сезонные + 18 крупнейших разделов (всего 20 — под сетку); страница «Каталог» — все разделы. */
export async function getPopularCategories(opts: { all?: boolean } = {}): Promise<(Category & { count: number })[]> {
  if (opts.all) return topCategories();
  const cats = topCategories({ home: true });
  const keep = new Set([...cats].sort((a, b) => b.count - a.count).slice(0, 20 - SEASONAL.length));
  return [...SEASONAL, ...cats.filter((c) => keep.has(c))];
}

export async function getCatalogTree(): Promise<CatalogNode[]> {
  return topNodes();
}

export async function getNewYearPicks(limit = 7): Promise<Product[]> {
  return newYearPicks.slice(0, limit);
}

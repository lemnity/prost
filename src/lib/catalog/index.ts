// Здесь позже подключаются провайдеры складов (Oasis и др.).
import { catalogTree, newProducts, saleProducts, popularCategories } from "./static-data";
import type { CatalogNode, Category, Product } from "./types";

export type { CatalogNode, Category, Product } from "./types";

export async function getNewProducts(limit = 6): Promise<Product[]> {
  return newProducts.slice(0, limit);
}

export async function getWeeklySale(limit = 6): Promise<Product[]> {
  return saleProducts.slice(0, limit);
}

export async function getPopularCategories(): Promise<Category[]> {
  return popularCategories;
}

export async function getCatalogTree(): Promise<CatalogNode[]> {
  return catalogTree;
}

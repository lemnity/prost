// Здесь позже подключаются провайдеры складов (Oasis и др.).
import { newProducts, popularCategories } from "./static-data";
import type { Category, Product } from "./types";

export type { Category, Product } from "./types";

export async function getNewProducts(limit = 6): Promise<Product[]> {
  return newProducts.slice(0, limit);
}

export async function getPopularCategories(): Promise<Category[]> {
  return popularCategories;
}

import type { Product } from "@/lib/catalog/types";
import type { FavoriteItem } from "./store";

/** Снимок карточки каталога для избранного. */
export function favoriteItem(p: Product): Omit<FavoriteItem, "addedAt"> {
  return {
    id: p.id,
    sku: p.sku,
    title: p.title,
    image: p.image,
    url: p.url,
    price: p.priceFrom,
    ...(p.oldPrice && p.oldPrice > p.priceFrom ? { oldPrice: p.oldPrice } : {}),
    stock: p.stock,
    ...(p.preorder ? { preorder: true } : {}),
    ...(p.isNew ? { isNew: true } : {}),
  };
}

/** Обратно в карточку каталога (страница избранного рендерит обычный ProductCard). */
export function favoriteToProduct(f: FavoriteItem): Product {
  return {
    id: f.id,
    sku: f.sku,
    title: f.title,
    image: f.image,
    url: f.url,
    priceFrom: f.price,
    ...(f.oldPrice ? { oldPrice: f.oldPrice } : {}),
    currency: "RUB",
    stock: f.stock,
    ...(f.preorder ? { preorder: true } : {}),
    ...(f.isNew ? { isNew: true } : {}),
  };
}

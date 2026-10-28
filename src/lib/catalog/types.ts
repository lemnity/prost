export type Product = {
  id: string;
  title: string;
  sku: string;
  priceFrom: number;
  /** Реальная цена до скидки (распродажа). */
  oldPrice?: number;
  currency: "RUB";
  image: string;
  url: string;
  stock: number;
  isNew?: boolean;
  /** Нет остатка, но есть поставка под заказ. */
  preorder?: boolean;
  /** Цвета модели для витрины (только если их больше одного); остаток — по всем размерам цвета. */
  swatches?: ProductSwatch[];
};

/** Цвет модели в карточке витрины: своя позиция каталога с фото, адресом, артикулом и остатком. */
export type ProductSwatch = Omit<Product, "swatches" | "currency" | "isNew"> & {
  /** Название цвета у поставщика («желтый», «синий классический»). */
  color: string;
  /** CSS-фон кружка, если у цвета нет фото. */
  swatch: string;
};

export type Category = {
  id: string;
  title: string;
  href: string;
  image: string;
};

export type CatalogNode = {
  id: string;
  title: string;
  href: string;
  children: { title: string; href: string }[];
};

/** Товар в листинге каталога (карточка + поля для фильтров). */
export type ListingProduct = Product & {
  brand: string;
  supplier: string;
  colors: string[];
  materials: string[];
  // Появятся с провайдером склада Oasis (URL: promo, print).
  promo?: boolean;
  prints: string[];
};

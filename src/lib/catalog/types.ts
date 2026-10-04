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
export type ListingProduct = Product & { brand: string };

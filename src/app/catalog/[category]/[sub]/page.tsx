import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingPage } from "@/components/catalog/listing-page";
import { ProductPage, productMetadata } from "@/components/catalog/product-page";
import { catalogTree } from "@/lib/catalog/static-data";
import {
  getAllProducts,
  getCategoryNode,
  getProductByPath,
  getProductsByCategory,
  getSubcategories,
} from "@/lib/catalog/products";

type Params = { category: string; sub: string };

export const dynamicParams = false;

// Второй сегмент — подкатегория или товар без подкатегории (префикс «item-»).
export function generateStaticParams(): Params[] {
  const subs = catalogTree.flatMap((c) =>
    getSubcategories(c.id).map((s) => ({ category: c.id, sub: s.slug })),
  );
  const items = getAllProducts()
    .filter((p) => !p.subcategory)
    .map((p) => ({ category: p.category, sub: p.url.split("/").pop()! }));
  return [...subs, ...items];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category, sub } = await params;
  if (sub.startsWith("item-")) return productMetadata(getProductByPath(category, null, sub));
  const info = getSubcategories(category).find((s) => s.slug === sub);
  return info ? { title: `${info.title} — каталог ProStyle` } : {};
}

export default async function SubcategoryPage({ params }: { params: Promise<Params> }) {
  const { category, sub } = await params;
  if (sub.startsWith("item-")) {
    const product = getProductByPath(category, null, sub);
    if (!product) notFound();
    return <ProductPage product={product} />;
  }

  const node = getCategoryNode(category);
  const subs = getSubcategories(category);
  const info = subs.find((s) => s.slug === sub);
  if (!node || !info) notFound();

  const products = getProductsByCategory(category, sub);
  const chips = [
    { title: "Все", href: node.href, active: false },
    ...subs.map((s) => ({ title: s.title, href: s.href, active: s.slug === sub, count: s.count })),
  ];
  return (
    <ListingPage
      title={info.title}
      crumbs={[
        { label: "Главная", href: "/" },
        { label: "Каталог", href: "/catalog" },
        { label: node.title, href: node.href },
        { label: info.title },
      ]}
      chips={chips}
      products={products}
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage, productMetadata } from "@/components/catalog/product-page";
import { getAllProducts, getProductByPath } from "@/lib/catalog/products";

type Params = { category: string; sub: string; item: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllProducts()
    .filter((p) => p.subcategory)
    .map((p) => ({ category: p.category, sub: p.subcategory!, item: p.url.split("/").pop()! }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category, sub, item } = await params;
  return productMetadata(getProductByPath(category, sub, item));
}

export default async function ItemPage({ params }: { params: Promise<Params> }) {
  const { category, sub, item } = await params;
  const product = getProductByPath(category, sub, item);
  if (!product) notFound();
  return <ProductPage product={product} />;
}

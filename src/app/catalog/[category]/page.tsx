import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingPage } from "@/components/catalog/listing-page";
import { catalogTree } from "@/lib/catalog/static-data";
import {
  collections,
  getCategoryNode,
  getCollectionProducts,
  getProductsByCategory,
  getSubcategories,
  isCollection,
} from "@/lib/catalog/products";

type Params = { category: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return [
    ...catalogTree.map((c) => ({ category: c.id })),
    ...Object.keys(collections).map((category) => ({ category })),
  ];
}

function titleOf(category: string): string | null {
  if (isCollection(category)) return collections[category].title;
  return getCategoryNode(category)?.title ?? null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category } = await params;
  const title = titleOf(category);
  return title ? { title: `${title} — каталог ProStyle` } : {};
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const title = titleOf(category);
  if (!title) notFound();

  const crumbs = [
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/catalog" },
    { label: title },
  ];

  if (isCollection(category)) {
    return <ListingPage title={title} crumbs={crumbs} products={getCollectionProducts(category)} />;
  }

  const products = getProductsByCategory(category);
  const chips = [
    { title: "Все", href: `/catalog/${category}`, active: true, count: products.length },
    ...getSubcategories(category).map((s) => ({ title: s.title, href: s.href, active: false, count: s.count })),
  ];
  return <ListingPage title={title} crumbs={crumbs} chips={chips} products={products} />;
}

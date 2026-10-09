import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OcProductPage, ocProductMetadata } from "@/components/catalog/oc-product-page";
import { ensureCanonical, legacyRedirect, productFromItem } from "@/server/catalog-routes";

type Props = { params: Promise<{ category: string; sub: string; item: string }> };

export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await productFromItem((await params).item);
  return row ? ocProductMetadata(row) : {};
}

export default async function ItemPage({ params }: Props) {
  const { category, sub, item } = await params;
  const path = `/catalog/${category}/${sub}/${item}`;
  const row = await productFromItem(item);
  if (!row) {
    await legacyRedirect(path);
    notFound();
  }
  ensureCanonical(row, path);
  return <OcProductPage row={row} />;
}

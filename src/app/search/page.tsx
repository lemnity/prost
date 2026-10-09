import type { Metadata } from "next";
import { OcListing, parseListing } from "@/components/catalog/oc-listing";
import { listWithFacets } from "@/server/catalog";
import { topSections } from "@/server/catalog-routes";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = parseListing(await searchParams).q;
  return { title: q ? `«${q}» — поиск ProStyle` : "Поиск — ProStyle", robots: { index: false } };
}

/** Поиск по названию и артикулу. */
export default async function SearchPage({ searchParams }: Props) {
  const q = parseListing(await searchParams);
  const text = q.q?.trim() ?? "";
  const { items, total, facets } = text.length >= 2 ? await listWithFacets({ ...q, q: text }) : { items: [], total: 0, facets: undefined };
  return (
    <OcListing
      title={text ? `Поиск: «${text}»` : "Поиск"}
      crumbs={[{ label: "Главная", href: "/" }, { label: "Поиск" }]}
      path="/search"
      query={q}
      items={items}
      total={total}
      facets={facets}
      sections={topSections()}
    />
  );
}

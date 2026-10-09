import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OcListing, parseListing } from "@/components/catalog/oc-listing";
import { catHref, childrenOf } from "@/lib/catalog/oasis-tree";
import { listWithFacets } from "@/server/catalog";
import { COLLECTIONS, isCollection, legacyRedirect, resolveCat, subSections, topSections } from "@/server/catalog-routes";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const title = isCollection(category) ? COLLECTIONS[category].title : resolveCat(category)?.name;
  return title ? { title: `${title} — каталог ProStyle` } : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const q = parseListing(await searchParams);
  const crumbs = [{ label: "Главная", href: "/" }, { label: "Каталог", href: "/catalog" }];

  if (isCollection(category)) {
    const col = COLLECTIONS[category];
    const query = { ...q, sort: q.sort === "popular" ? col.sort : q.sort, inStock: q.inStock || col.inStock };
    const { items, total, facets } = await listWithFacets({ ...query, sale: col.sale, theme: col.theme });
    return <OcListing title={col.title} crumbs={[...crumbs, { label: col.title }]} path={`/catalog/${category}`} query={q} items={items} total={total} facets={facets} sections={topSections()} />;
  }

  const cat = resolveCat(category);
  if (!cat) {
    await legacyRedirect(`/catalog/${category}`);
    notFound();
  }
  const filter = q.c ? childrenOf(cat.id).find((c) => String(c.id) === q.c) : undefined;
  const { items, total, facets } = await listWithFacets({ ...q, category: filter?.id ?? cat.id });
  return (
    <OcListing
      title={cat.name}
      crumbs={[...crumbs, { label: cat.name }]}
      path={catHref(cat.id)}
      query={q}
      items={items}
      total={total}
      facets={facets}
      sections={subSections(cat)}
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OcListing, parseListing } from "@/components/catalog/oc-listing";
import { OcProductPage, ocProductMetadata } from "@/components/catalog/oc-product-page";
import { catHref, childrenOf, getCat } from "@/lib/catalog/oasis-tree";
import { listProducts } from "@/server/catalog";
import { ensureCanonical, legacyRedirect, productFromItem, resolveCat, subSections } from "@/server/catalog-routes";

type Props = { params: Promise<{ category: string; sub: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, sub } = await params;
  if (sub.startsWith("item-")) {
    const row = await productFromItem(sub);
    return row ? ocProductMetadata(row) : {};
  }
  const cat = resolveCat(category, sub);
  return cat ? { title: `${cat.name} — каталог ProStyle` } : {};
}

// Второй сегмент — подраздел или товар раздела верхнего уровня (префикс «item-»).
export default async function SubPage({ params, searchParams }: Props) {
  const { category, sub } = await params;
  const path = `/catalog/${category}/${sub}`;
  if (sub.startsWith("item-")) {
    const row = await productFromItem(sub);
    if (!row) {
      await legacyRedirect(path);
      notFound();
    }
    ensureCanonical(row, path);
    return <OcProductPage row={row} />;
  }
  const cat = resolveCat(category, sub);
  if (!cat) {
    await legacyRedirect(path);
    notFound();
  }
  const parent = cat.parent ? getCat(cat.parent)! : cat;
  const q = parseListing(await searchParams);
  const kids = childrenOf(cat.id);
  const filter = q.c ? kids.find((c) => String(c.id) === q.c) : undefined;
  const { items, total } = await listProducts({ ...q, category: filter?.id ?? cat.id });
  const chips = kids.length
    ? [{ title: "Все", href: catHref(cat.id), active: !filter }, ...kids.map((k) => ({ title: k.name, href: catHref(k.id), active: k.id === filter?.id, count: k.count }))]
    : undefined;
  return (
    <OcListing
      title={filter?.name ?? cat.name}
      crumbs={[
        { label: "Главная", href: "/" },
        { label: "Каталог", href: "/catalog" },
        { label: parent.name, href: catHref(parent.id) },
        { label: cat.name, ...(filter ? { href: catHref(cat.id) } : {}) },
        ...(filter ? [{ label: filter.name }] : []),
      ]}
      path={catHref(cat.id)}
      query={q}
      items={items}
      total={total}
      sections={subSections(parent, cat.id)}
      chips={chips}
    />
  );
}

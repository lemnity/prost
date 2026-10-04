import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductCard } from "./product-card";
import { ProductDetail, type VariantView } from "./product-detail";
import { asset } from "@/lib/asset";
import { applications } from "@/content/home";
import {
  getCategoryNode,
  getProductByUrl,
  getSimilarProducts,
  getSubcategories,
  toCard,
  type CatalogProduct,
} from "@/lib/catalog/products";

export function productMetadata(product: CatalogProduct | null): Metadata {
  if (!product) return {};
  return {
    title: `${product.title} — ProStyle`,
    description: `${product.title}, артикул ${product.sku}. Нанесение логотипа, доставка по России.`,
  };
}

/** Цвет/вариант из названия: «… (синий)» или «…, синий». */
function variantLabel(title: string): string {
  const paren = title.match(/\(([^()]+)\)\s*$/);
  if (paren) return paren[1].trim();
  const comma = title.lastIndexOf(",");
  return comma > 0 ? title.slice(comma + 1).trim() : title;
}

/** Артикул варианта: хвост адреса по шаблону артикула товара (MO9211-04 → MO9211-48). */
function skuFromUrl(product: CatalogProduct, url: string): string {
  const alnum = (x: string) => x.replace(/[^a-z0-9]/gi, "");
  const base = alnum(product.sku);
  const own = alnum(product.url.split("/").pop() ?? "");
  const slug = alnum(url.split("/").pop() ?? "");
  if (!base || !own.toLowerCase().endsWith(base.toLowerCase()) || slug.length < base.length) return product.sku;
  const tail = slug.slice(-base.length);
  let k = 0;
  return product.sku.replace(/[a-z0-9]/gi, (ch) => {
    const c = tail[k++];
    return ch === ch.toUpperCase() ? c.toUpperCase() : c.toLowerCase();
  });
}

function buildVariants(product: CatalogProduct): { variants: VariantView[]; initial: number } {
  const self: VariantView = {
    key: product.url,
    label: variantLabel(product.title),
    image: product.image,
    id: product.id,
    url: product.url,
    title: product.title,
    sku: product.sku,
    stock: product.stock,
    price: product.price,
  };
  const seen = new Set<string>();
  const variants: VariantView[] = [];
  product.variants.forEach((v, i) => {
    if (seen.has(v.url)) return;
    seen.add(v.url);
    if (v.url === product.url) {
      variants.push({ ...self, image: v.image || product.image });
      return;
    }
    const match = getProductByUrl(v.url);
    variants.push(
      match
        ? {
            key: v.url,
            label: variantLabel(match.title),
            image: v.image || match.image,
            id: match.id,
            url: match.url,
            title: match.title,
            sku: match.sku,
            stock: match.stock,
            price: match.price,
          }
        : // Вариант без данных в выгрузке: фото и артикул (из адреса), наличие — по запросу.
          {
            ...self,
            key: v.url,
            label: v.title || `Вариант ${i + 1}`,
            image: v.image,
            sku: v.sku ?? skuFromUrl(product, v.url),
            stock: null,
          },
    );
  });
  if (!seen.has(product.url)) variants.unshift(self);
  return { variants, initial: Math.max(0, variants.findIndex((v) => v.key === product.url)) };
}

export function ProductPage({ product }: { product: CatalogProduct }) {
  const node = getCategoryNode(product.category);
  const sub = product.subcategory
    ? getSubcategories(product.category).find((s) => s.slug === product.subcategory)
    : undefined;
  const { variants, initial } = buildVariants(product);
  const similar = getSimilarProducts(product);
  const crumbs = [
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/catalog" },
    ...(node ? [{ label: node.title, href: node.href }] : []),
    ...(sub ? [{ label: sub.title, href: sub.href }] : []),
    { label: product.title },
  ];

  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={crumbs} />
      </Container>

      <Container className="py-6 md:py-8">
        <ProductDetail title={product.title} brand={product.brand} variants={variants} initial={initial}>
          <section aria-labelledby="apps-title" className="mt-8 border-t border-line pt-6">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="apps-title" className="text-[17px] font-semibold">
                Виды нанесения
              </h2>
              <Link href={applications.link.href} className="text-[13px] font-medium text-brand hover:text-brand-hover">
                {applications.link.label}
              </Link>
            </div>
            <ul className="flex flex-wrap gap-2">
              {applications.items.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-surface pl-1 pr-3 text-[13px] text-ink hover:text-brand"
                  >
                    <Image src={asset(a.image)} alt="" width={28} height={28} sizes="28px" className="size-7 rounded-full bg-white object-contain" />
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </ProductDetail>
      </Container>

      {similar.length ? (
        <section aria-labelledby="similar-title" className="py-6 md:py-8">
          <Container>
            <SectionHeader
              id="similar-title"
              title="Похожие товары"
              link={sub ? { label: "Смотреть все", href: sub.href } : node ? { label: "Смотреть все", href: node.href } : undefined}
            />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {similar.map((p) => (
                <li key={p.url} className="grid">
                  <ProductCard product={toCard(p)} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}
    </main>
  );
}

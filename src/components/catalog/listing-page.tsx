import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { CatalogListing, CatalogListingIsland } from "./catalog-listing";
import { SubscribeBlock } from "./subscribe-block";
import { getBrands, toCard, type CatalogProduct } from "@/lib/catalog/products";
import type { ListingProduct } from "@/lib/catalog/types";

export type Chip = { title: string; href: string; active: boolean; count?: number };

export function ListingPage({
  title,
  crumbs,
  chips,
  products,
}: {
  title: string;
  crumbs: Crumb[];
  chips?: Chip[];
  products: CatalogProduct[];
}) {
  const items: ListingProduct[] = products.map((p) => ({ ...toCard(p), brand: p.brand }));
  const brands = getBrands(products);
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-4 text-[30px] font-bold leading-[1.12] tracking-tight md:text-[36px]">{title}</h1>
        {chips?.length ? (
          <nav aria-label="Подкатегории" className="mt-4">
            <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-8 md:px-8">
              {chips.map((c) => (
                <li key={c.href} className="shrink-0">
                  <Link
                    href={c.href}
                    aria-current={c.active ? "page" : undefined}
                    className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-[13px] transition-colors ${
                      c.active
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-white text-ink hover:border-brand hover:text-brand"
                    }`}
                  >
                    {c.title}
                    {c.count ? (
                      <span className={c.active ? "text-white/80" : "text-faint"}>{c.count}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </Container>

      <Container className="py-6 md:py-8">
        {items.length ? (
          <Suspense fallback={<CatalogListing products={items} brands={brands} />}>
            <CatalogListingIsland products={items} brands={brands} />
          </Suspense>
        ) : (
          <div className="rounded-[10px] bg-surface px-6 py-12 text-center">
            <p className="text-[18px] font-semibold">Товары скоро появятся</p>
            <p className="mt-2 text-sm text-muted">
              Мы пополняем каталог. Оставьте заявку — подберём товары под вашу задачу.
            </p>
            <SubscribeBlock />
          </div>
        )}
      </Container>
      {items.length ? null : <ConsultationCta />}
    </main>
  );
}

import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { CatalogListing, CatalogListingIsland } from "./catalog-listing";
import { SubscribeBlock } from "./subscribe-block";
import { SectionSelect, type SectionLink } from "./section-select";
import { SectionSidebar } from "./section-sidebar";
import { toCard, type CatalogProduct } from "@/lib/catalog/products";
import type { ListingProduct } from "@/lib/catalog/types";

export type Chip = SectionLink;

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
  const sections = chips?.length ? chips : null;
  const items: ListingProduct[] = products.map((p) => ({
    ...toCard(p),
    brand: p.brand,
    supplier: p.supplier,
    colors: p.colors,
    materials: p.materials,
  }));
  const nav = sections ? <SectionSidebar items={sections} /> : null;
  const select = sections ? <SectionSelect items={sections} /> : null;
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-4 text-[30px] font-bold leading-[1.12] tracking-tight md:text-[36px]">{title}</h1>
      </Container>

      <Container className="py-6 md:py-8">
        {items.length ? (
          <Suspense fallback={<CatalogListing products={items} sectionsNav={nav} sectionsSelect={select} />}>
            <CatalogListingIsland products={items} sectionsNav={nav} sectionsSelect={select} />
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

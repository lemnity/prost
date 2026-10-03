import { ProductCard } from "@/components/catalog/product-card";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { getNewProducts } from "@/lib/catalog";

export async function NewProducts() {
  const products = await getNewProducts(6);
  return (
    <section aria-labelledby="new-products-title" className="py-5 md:py-6">
      <Container>
        <SectionHeader
          id="new-products-title"
          title="Новинки"
          link={{ label: "Смотреть все новинки", href: "/catalog/new" }}
        />
        <div className="no-scrollbar -mx-4 scroll-px-4 md:scroll-px-8 lg:scroll-px-0 flex snap-x gap-3 overflow-x-auto px-4 md:-mx-8 md:px-8 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
          {products.map((p) => (
            <div key={p.id} className="flex w-[220px] shrink-0 snap-start lg:w-auto [&>*]:w-full">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

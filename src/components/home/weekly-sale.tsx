import { ProductCard } from "@/components/catalog/product-card";
import { Countdown } from "@/components/home/countdown";
import { SectionHeader } from "@/components/ui/section-header";
import { Container } from "@/components/ui/container";
import { getWeeklySale } from "@/lib/catalog";
import { getSaleRemaining } from "@/lib/sale";

export async function WeeklySale() {
  const products = await getWeeklySale(6);
  const initial = getSaleRemaining(new Date());
  return (
    <section id="weekly-sale" aria-labelledby="weekly-sale-title" className="scroll-mt-4 py-5 md:py-6">
      <Container>
        <SectionHeader
          id="weekly-sale-title"
          title="Распродажа недели"
          aside={<Countdown initial={initial} />}
          link={{ label: "Все скидки", href: "/catalog/sale" }}
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

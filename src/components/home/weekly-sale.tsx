import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { SaleCountdown } from "@/components/home/sale-countdown";
import { Container } from "@/components/ui/container";
import { getWeeklySale } from "@/lib/catalog";
import { getSaleRemaining } from "@/lib/sale";

export async function WeeklySale() {
  const products = await getWeeklySale(6);
  const initial = getSaleRemaining(new Date());
  return (
    <section id="weekly-sale" aria-labelledby="weekly-sale-title" className="scroll-mt-4 py-5 md:py-6">
      <Container>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 md:mb-6">
          <h2 id="weekly-sale-title" className="text-[22px] font-bold md:text-[26px]">
            Распродажа недели
          </h2>
          <SaleCountdown initial={initial} />
        </div>
        <div className="no-scrollbar -mx-4 scroll-px-4 md:scroll-px-8 lg:scroll-px-0 flex snap-x gap-3 overflow-x-auto px-4 md:-mx-8 md:px-8 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
          {products.map((p) => (
            <div key={p.id} className="flex w-[220px] shrink-0 snap-start lg:w-auto [&>*]:w-full">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <div className="mt-3 text-right">
          <Link
            href="/catalog/sale"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover md:text-[13px]"
          >
            Все скидки
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

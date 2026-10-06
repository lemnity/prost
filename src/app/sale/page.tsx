import type { Metadata } from "next";
import { CalendarClock, Info, Package, Palette } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductCard } from "@/components/catalog/product-card";
import { SubscribeBlock } from "@/components/catalog/subscribe-block";
import { Countdown } from "@/components/home/countdown";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { formatQty } from "@/lib/format";
import { plural } from "@/lib/plural";
import { getSaleRemaining } from "@/lib/sale";
import { getCollectionProducts, toCard } from "@/lib/catalog/products";

export const metadata: Metadata = {
  title: "Распродажа недели — скидки на сувениры | ProStyle",
  description:
    "Скидки недели на корпоративные подарки и сувенирную продукцию. Новая подборка каждую неделю, цены действуют до воскресенья.",
};

const discountOf = (price: number, old?: number) => (old && old > price ? Math.round((1 - price / old) * 100) : 0);

const TERMS = [
  { Icon: CalendarClock, title: "До воскресенья 23:59", text: "Цены действуют до конца недели по времени Тюмени, в понедельник — новая подборка" },
  { Icon: Package, title: "Количество ограничено", text: "Скидка действует на остаток склада, поэтому популярные позиции заканчиваются быстрее" },
  { Icon: Palette, title: "Нанесение логотипа", text: "Цены указаны без нанесения — менеджер рассчитает печать под ваш тираж" },
  { Icon: Info, title: "Минимальный заказ", text: "Минимальная сумма заказа — 10\u00a0000\u00a0₽, товары распродажи можно сочетать с любыми другими" },
];

export default function SalePage() {
  const products = getCollectionProducts("sale")
    .map(toCard)
    .sort((a, b) => discountOf(b.priceFrom, b.oldPrice) - discountOf(a.priceFrom, a.oldPrice));
  const maxDiscount = Math.max(0, ...products.map((p) => discountOf(p.priceFrom, p.oldPrice)));
  const stock = products.reduce((s, p) => s + Math.max(0, p.stock), 0);

  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Распродажа недели" }]} />

        <section
          aria-labelledby="sale-title"
          className="mt-4 grid gap-6 rounded-[20px] bg-brand-soft p-5 md:mt-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:p-10"
        >
          <div>
            {maxDiscount ? (
              <span className="inline-flex rounded-full bg-brand px-3 py-1 text-[13px] font-bold text-white">
                Скидки до {maxDiscount}%
              </span>
            ) : null}
            <h1 id="sale-title" className="mt-3 text-[32px] font-bold leading-[1.08] tracking-tight md:text-[48px]">
              Распродажа недели
            </h1>
            <p className="mt-3 max-w-[560px] text-[15px] text-muted md:text-[16px]">
              Сувениры и подарки со склада по сниженным ценам. Каждую неделю — новая подборка, цены действуют до воскресенья.
            </p>
          </div>
          <div className="rounded-[16px] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)] md:p-6">
            <Countdown initial={getSaleRemaining(new Date())} large />
            <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
              <div>
                <dt className="text-[12px] text-muted">В подборке</dt>
                <dd className="mt-0.5 whitespace-nowrap text-[18px] font-bold md:text-[20px]">
                  {products.length} {plural("item", products.length)}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Скидка</dt>
                <dd className="mt-0.5 whitespace-nowrap text-[18px] font-bold text-brand md:text-[20px]">
                  {maxDiscount ? `до −${maxDiscount}%` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">На складе</dt>
                <dd className="mt-0.5 whitespace-nowrap text-[18px] font-bold md:text-[20px]">
                  {stock ? `${formatQty(stock)} шт.` : "—"}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </Container>

      <section aria-labelledby="sale-products">
        <Container className="py-8 md:py-10">
        <h2 id="sale-products" className="text-[24px] font-bold md:text-[28px]">Товары со скидкой</h2>
        {products.length ? (
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5 rounded-[14px] bg-surface px-6 py-12 text-center">
            <p className="text-[18px] font-semibold">Новая подборка готовится</p>
            <p className="mt-2 text-sm text-muted">Скидки обновляются каждую неделю.</p>
          </div>
        )}
        </Container>
      </section>

      <section aria-labelledby="sale-terms">
        <Container className="pb-8 md:pb-10">
        <h2 id="sale-terms" className="text-[24px] font-bold md:text-[28px]">Условия распродажи</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TERMS.map(({ Icon, title, text }) => (
            <li key={title} className="rounded-[14px] bg-surface p-5">
              <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-[16px] font-semibold">{title}</h3>
              <p className="mt-1 text-[13px] leading-snug text-muted">{text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-[14px] bg-surface px-5 pb-6 text-center [&>div]:mt-0 [&>div]:border-0">
          <SubscribeBlock />
        </div>
        </Container>
      </section>

      <ConsultationCta />
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CheckoutView } from "@/components/cart/checkout-view";

export const metadata: Metadata = {
  title: "Оформление заказа — ProStyle",
  description: "Оформление заявки на корпоративные подарки ProStyle.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <nav aria-label="Хлебные крошки" className="text-[13px] text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-brand">Главная</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/cart" className="hover:text-brand">Корзина</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">Оформление заказа</li>
          </ol>
        </nav>
        <h1 className="mt-6 text-[30px] font-bold leading-[1.12] tracking-tight md:mt-8 md:text-[44px]">
          Оформление заказа
        </h1>
      </Container>
      <CheckoutView />
    </main>
  );
}

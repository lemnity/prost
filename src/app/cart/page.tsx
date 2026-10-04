import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Корзина — ProStyle",
  description: "Состав заказа и оформление заявки на корпоративные подарки ProStyle.",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <nav aria-label="Хлебные крошки" className="text-[13px] text-muted">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-brand">Главная</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">Корзина</li>
          </ol>
        </nav>
        <h1 className="mt-6 text-[30px] font-bold leading-[1.12] tracking-tight md:mt-8 md:text-[44px]">
          Корзина
        </h1>
      </Container>
      <CartView />
    </main>
  );
}

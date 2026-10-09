import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { CancelOrder } from "@/components/order/cancel-order";

export const metadata: Metadata = { title: "Отмена заказа — ProStyle", robots: { index: false, follow: false } };

export default function CancelOrderPage() {
  return (
    <main id="main">
      <Container className="py-10 md:py-16">
        <Suspense fallback={null}>
          <CancelOrder />
        </Suspense>
      </Container>
    </main>
  );
}

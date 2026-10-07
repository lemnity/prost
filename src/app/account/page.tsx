import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { OrdersSection } from "@/components/account/orders";

export const metadata: Metadata = {
  title: "Заявки — личный кабинет ProStyle",
  description: "Текущие заявки и история заказов в личном кабинете ProStyle.",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <AccountShell section="orders">
      <OrdersSection />
    </AccountShell>
  );
}

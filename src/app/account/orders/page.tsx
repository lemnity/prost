import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { OrdersList } from "@/components/account/orders";

export const metadata: Metadata = {
  title: "Мои заказы — ProStyle",
  description: "История заказов в личном кабинете ProStyle.",
  robots: { index: false },
};

export default function OrdersPage() {
  return (
    <AccountShell section="orders">
      <OrdersList />
    </AccountShell>
  );
}

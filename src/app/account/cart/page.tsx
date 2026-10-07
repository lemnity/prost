import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Корзина — личный кабинет ProStyle",
  description: "Корзина в личном кабинете ProStyle.",
  robots: { index: false },
};

export default function AccountCartPage() {
  return (
    <AccountShell section="cart" guest>
      <CartView embedded />
    </AccountShell>
  );
}

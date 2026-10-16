import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { CabinetCart } from "@/components/account/admin-cabinet";

export const metadata: Metadata = {
  title: "Корзина — личный кабинет ProStyle",
  description: "Корзина в личном кабинете ProStyle.",
  robots: { index: false },
};

export default function AccountCartPage() {
  return (
    <AccountShell section="cart" guest>
      <CabinetCart />
    </AccountShell>
  );
}

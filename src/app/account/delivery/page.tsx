import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { CabinetDelivery } from "@/components/account/admin-cabinet";

export const metadata: Metadata = {
  title: "Доставка — личный кабинет ProStyle",
  description: "Способ получения и адреса доставки в личном кабинете ProStyle.",
  robots: { index: false },
};

export default function DeliveryPage() {
  return (
    <AccountShell section="delivery">
      <CabinetDelivery />
    </AccountShell>
  );
}

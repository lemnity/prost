import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { AccountOverview } from "@/components/account/overview";

export const metadata: Metadata = {
  title: "Личный кабинет — ProStyle",
  description: "Личный кабинет ProStyle: заказы, избранное, данные компании.",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <AccountShell section="overview">
      <AccountOverview />
    </AccountShell>
  );
}

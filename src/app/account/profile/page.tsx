import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = {
  title: "Профиль и реквизиты — ProStyle",
  description: "Контактные данные и реквизиты компании в личном кабинете ProStyle.",
  robots: { index: false },
};

export default function ProfilePage() {
  return (
    <AccountShell section="profile">
      <ProfileForm />
    </AccountShell>
  );
}

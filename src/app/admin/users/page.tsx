import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminUsers } from "@/components/admin/admin-users";

export const metadata: Metadata = { title: "Пользователи — админка ProStyle", robots: { index: false, follow: false } };

export default function AdminUsersPage() {
  return (
    <AdminShell section="users">
      <AdminUsers />
    </AdminShell>
  );
}

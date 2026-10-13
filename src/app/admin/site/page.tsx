import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSite } from "@/components/admin/admin-site";

export const metadata: Metadata = { title: "Сайт — админка ProStyle", robots: { index: false, follow: false } };

export default function AdminSitePage() {
  return (
    <AdminShell section="site">
      <AdminSite />
    </AdminShell>
  );
}

import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminStock } from "@/components/admin/admin-stock";

export const metadata: Metadata = { title: "Склад — админка ProStyle", robots: { index: false, follow: false } };

export default function AdminStockPage() {
  return (
    <AdminShell section="stock">
      <AdminStock />
    </AdminShell>
  );
}

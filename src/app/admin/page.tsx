import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminOrders } from "@/components/admin/admin-orders";

export const metadata: Metadata = { title: "Админка — ProStyle", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <AdminShell section="orders">
      <Suspense fallback={null}>
        <AdminOrders />
      </Suspense>
    </AdminShell>
  );
}

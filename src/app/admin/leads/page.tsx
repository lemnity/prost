import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminLeads } from "@/components/admin/admin-leads";

export const metadata: Metadata = { title: "Обращения — админка ProStyle", robots: { index: false, follow: false } };

export default function AdminLeadsPage() {
  return (
    <AdminShell section="leads">
      <AdminLeads />
    </AdminShell>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Inbox, LogOut, Package, Users, Warehouse } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LoginForm } from "@/components/account/auth-forms";
import { fullName, signOut } from "@/lib/account/store";
import { useSession, useSessionLoaded } from "@/lib/account/use-account";

export type AdminSection = "orders" | "leads" | "users" | "stock";

const NAV: { key: AdminSection; label: string; href: string; Icon: typeof Package }[] = [
  { key: "orders", label: "Заявки", href: "/admin", Icon: Package },
  { key: "leads", label: "Обращения", href: "/admin/leads", Icon: Inbox },
  { key: "users", label: "Пользователи", href: "/admin/users", Icon: Users },
  { key: "stock", label: "Склад", href: "/admin/stock", Icon: Warehouse },
];

/** Каркас админки: вход только для роли admin. */
export function AdminShell({ section, children }: { section: AdminSection; children: ReactNode }) {
  const session = useSession();
  const loaded = useSessionLoaded();
  const here = NAV.find((n) => n.key === section)!;

  if (!loaded) {
    return <Container className="py-10"><div aria-busy="true" className="h-[360px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none" /></Container>;
  }
  if (!session || session.role !== "admin") {
    return (
      <main id="main">
        <Container className="py-10">
          <div className="mx-auto max-w-[440px] rounded-[14px] border border-line bg-white p-6">
            <h1 className="text-[26px] font-bold">Админка ProStyle</h1>
            <p className="mt-1 text-[14px] text-muted">
              {session ? "У этого кабинета нет прав администратора. Войдите под учётной записью администратора." : "Войдите под учётной записью администратора."}
            </p>
            <div className="mt-5">
              <LoginForm redirect={here.href} showRegister={false} />
            </div>
          </div>
        </Container>
      </main>
    );
  }
  return (
    <main id="main">
      <Container className="py-6 md:py-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mr-auto text-[26px] font-bold md:text-[30px]">Админка</h1>
          <span className="text-[13px] text-muted">{fullName(session.profile) || session.profile.email}</span>
          <button type="button" onClick={signOut} className="inline-flex h-9 items-center gap-1.5 text-[13px] font-medium text-muted hover:text-brand">
            <LogOut size={15} aria-hidden="true" /> Выйти
          </button>
        </div>
        <nav aria-label="Разделы админки" className="mt-4 flex flex-wrap gap-2">
          {NAV.map(({ key, label, href, Icon }) => (
            <Link
              key={key}
              href={href}
              aria-current={key === section ? "page" : undefined}
              className={`inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-[14px] font-semibold ${key === section ? "bg-ink text-white" : "bg-surface text-ink hover:text-brand"}`}
            >
              <Icon size={16} aria-hidden="true" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6">{children}</div>
      </Container>
    </main>
  );
}

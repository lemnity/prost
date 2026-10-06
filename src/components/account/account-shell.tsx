"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Heart, LayoutGrid, LogOut, Package, UserRound } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buttonClass } from "@/components/ui/button";
import { useHydrated } from "@/lib/cart/use-cart";
import { signOut } from "@/lib/account/store";
import { useSession } from "@/lib/account/use-account";
import { FAVORITES_HREF } from "@/lib/favorites/store";

export type AccountSection = "overview" | "orders" | "profile";

const NAV: { key: AccountSection | "favorites"; label: string; href: string; Icon: typeof Heart }[] = [
  { key: "overview", label: "Обзор", href: "/account", Icon: LayoutGrid },
  { key: "orders", label: "Мои заказы", href: "/account/orders", Icon: Package },
  { key: "profile", label: "Профиль и реквизиты", href: "/account/profile", Icon: UserRound },
  { key: "favorites", label: "Избранное", href: FAVORITES_HREF, Icon: Heart },
];

const TITLES: Record<AccountSection, string> = {
  overview: "Личный кабинет",
  orders: "Мои заказы",
  profile: "Профиль и реквизиты",
};

export function AccountShell({ section, children }: { section: AccountSection; children: ReactNode }) {
  const hydrated = useHydrated();
  const session = useSession();
  const title = TITLES[section];
  const crumbs =
    section === "overview"
      ? [{ label: "Главная", href: "/" }, { label: title }]
      : [{ label: "Главная", href: "/" }, { label: "Личный кабинет", href: "/account" }, { label: title }];

  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-6 text-[30px] font-bold leading-[1.12] tracking-tight md:mt-8 md:text-[44px]">{title}</h1>
      </Container>
      <Container className="py-6 md:py-8">
        {!hydrated ? (
          <div aria-busy="true" aria-label="Кабинет загружается" className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="hidden h-[240px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none lg:block" />
            <div className="h-[320px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none" />
          </div>
        ) : !session ? (
          <div className="flex flex-col items-center rounded-[14px] bg-surface px-5 py-12 text-center md:py-16">
            <UserRound size={40} strokeWidth={1.5} aria-hidden="true" className="text-brand" />
            <h2 className="mt-4 text-[22px] font-bold md:text-[26px]">Войдите в личный кабинет</h2>
            <p className="mt-2 max-w-md text-sm text-muted">
              В кабинете — история заказов, избранное и данные компании для быстрого оформления.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/account/login" className={buttonClass({ size: "lg", px: "px-8" })}>Войти</Link>
              <Link href="/account/register" className={buttonClass({ variant: "outline", size: "lg" })}>Создать кабинет</Link>
            </div>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
            <nav aria-label="Разделы кабинета" className="min-w-0 rounded-[14px] bg-surface p-3 lg:sticky lg:top-24">
              <div className="hidden border-b border-line px-3 pb-3 pt-1 lg:block">
                <p className="truncate text-[15px] font-semibold">{session.profile.name}</p>
                <p className="truncate text-[13px] text-muted">{session.profile.company || session.profile.email}</p>
              </div>
              <ul className="no-scrollbar flex gap-1 overflow-x-auto lg:mt-2 lg:flex-col">
                {NAV.map(({ key, label, href, Icon }) => {
                  const on = key === section;
                  return (
                    <li key={key} className="shrink-0">
                      <Link
                        href={href}
                        aria-current={on ? "page" : undefined}
                        className={`flex h-11 items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 text-[14px] font-medium ${
                          on ? "bg-white text-brand shadow-[0_1px_4px_rgba(0,0,0,0.06)]" : "text-ink hover:bg-white hover:text-brand"
                        }`}
                      >
                        <Icon size={18} aria-hidden="true" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
                <li className="shrink-0 lg:mt-1 lg:border-t lg:border-line lg:pt-1">
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex h-11 w-full items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 text-[14px] font-medium text-muted hover:bg-white hover:text-brand"
                  >
                    <LogOut size={18} aria-hidden="true" />
                    Выйти
                  </button>
                </li>
              </ul>
            </nav>
            <div className="min-w-0">{children}</div>
          </div>
        )}
      </Container>
    </main>
  );
}

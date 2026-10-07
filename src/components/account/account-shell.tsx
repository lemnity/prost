"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { ChevronDown, Heart, LogOut, MessageCircle, Package, ShoppingCart, Truck, UserRound } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buttonClass } from "@/components/ui/button";
import { useHydrated } from "@/lib/cart/use-cart";
import { fullName, isCurrentOrder, signOut } from "@/lib/account/store";
import { useSession } from "@/lib/account/use-account";
import { cartCount } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";
import { useFavorites } from "@/lib/favorites/use-favorites";
import { FAVORITES_HREF } from "@/lib/favorites/store";
import { AGENT } from "@/lib/chat/agent";
import { asset } from "@/lib/asset";

export type AccountSection = "orders" | "cart" | "favorites" | "delivery" | "profile" | "chat";

const NAV: { key: AccountSection; label: string; href: string; Icon: typeof Heart }[] = [
  { key: "orders", label: "Заявки", href: "/account", Icon: Package },
  { key: "cart", label: "Корзина", href: "/account/cart", Icon: ShoppingCart },
  { key: "favorites", label: "Избранное", href: FAVORITES_HREF, Icon: Heart },
  { key: "delivery", label: "Доставка", href: "/account/delivery", Icon: Truck },
  { key: "profile", label: "Личные данные", href: "/account/profile", Icon: UserRound },
];

const TITLES: Record<AccountSection, string> = {
  orders: "Заявки",
  cart: "Корзина",
  favorites: "Избранное",
  delivery: "Доставка",
  profile: "Личные данные",
  chat: "Чат с менеджером",
};

export function AccountShell({
  section,
  guest = false,
  children,
}: {
  section: AccountSection;
  /** Раздел доступен и без входа (чат после оформления заявки гостем). */
  guest?: boolean;
  children: ReactNode;
}) {
  const hydrated = useHydrated();
  const session = useSession();
  const [now] = useState(() => Date.now());
  const counts: Partial<Record<AccountSection, number>> = {
    cart: cartCount(useCart()),
    favorites: useFavorites().length,
    orders: session?.orders.filter((o) => isCurrentOrder(o, now)).length ?? 0,
  };
  const title = TITLES[section];
  const crumbs = [{ label: "Главная", href: "/" }, { label: "Личный кабинет", href: "/account" }, { label: title }];

  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={crumbs} />
        <h1 className="sr-only">{title}</h1>
      </Container>
      <Container className="pt-5 pb-8 md:pt-6 md:pb-10">
        {!hydrated ? (
          <div aria-busy="true" aria-label="Кабинет загружается" className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="hidden h-[240px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none lg:block" />
            <div className="h-[320px] animate-pulse rounded-[14px] bg-surface motion-reduce:animate-none" />
          </div>
        ) : !session && guest ? (
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 rounded-[14px] bg-brand-soft p-4 sm:flex-row sm:items-center">
              <UserRound size={26} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand" />
              <p className="text-[14px] sm:flex-1">
                <span className="font-semibold">Создайте личный кабинет,</span>
                <span className="text-muted"> чтобы видеть историю заказов и быстрее оформлять следующие.</span>
              </p>
              <div className="flex gap-2">
                <Link href="/account/register" className={buttonClass({ size: "sm" })}>Создать кабинет</Link>
                <Link href="/account/login" className={buttonClass({ variant: "outline", size: "sm" })}>Войти</Link>
              </div>
            </div>
            {children}
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
            <div className="grid min-w-0 gap-2 lg:hidden">
              <ChatLink active={section === "chat"} />
              <SectionMenu section={section} counts={counts} />
            </div>
            <nav aria-label="Разделы кабинета" className="hidden min-w-0 rounded-[14px] bg-surface p-3 lg:sticky lg:top-24 lg:block">
              <div className="border-b border-line px-3 pb-3 pt-1">
                <p className="truncate text-[15px] font-semibold">{fullName(session.profile)}</p>
                <p className="truncate text-[13px] text-muted">{session.profile.company || session.profile.email}</p>
              </div>
              <div className="mb-2 mt-3">
                <ChatLink active={section === "chat"} />
              </div>
              <SectionList section={section} counts={counts} />
            </nav>
            <div className="min-w-0">{children}</div>
          </div>
        )}
      </Container>
    </main>
  );
}

/** Заметная ссылка на чат: фото менеджера и статус «в сети». */
function ChatLink({ active }: { active: boolean }) {
  return (
    <Link
      href="/account/chat"
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-[12px] bg-brand bg-chat-gradient p-2.5 text-white shadow-[0_4px_14px_rgba(208,46,49,0.28)] hover:brightness-105 ${
        active ? "ring-2 ring-inset ring-white/70" : ""
      }`}
    >
      <span className="relative shrink-0">
        <Image
          src={asset(AGENT.photo)}
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-full object-cover ring-2 ring-white/80"
        />
        <span aria-hidden="true" className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#3BB273] ring-2 ring-brand" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[14px] font-semibold leading-tight">
          <MessageCircle size={15} aria-hidden="true" />
          Чат с менеджером
        </span>
        <span className="block truncate text-[12px] text-white/80">{AGENT.firstName} · в сети</span>
      </span>
    </Link>
  );
}

type Counts = Partial<Record<AccountSection, number>>;

function Badge({ n }: { n?: number }) {
  return n ? (
    <span className="ml-auto rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold tabular-nums text-brand">{n > 99 ? "99+" : n}</span>
  ) : null;
}

/** Список разделов (боковое меню на компьютере и выпадающее на телефоне). */
function SectionList({ section, counts, onPick }: { section: AccountSection; counts: Counts; onPick?: () => void }) {
  return (
    <ul className="grid gap-1">
      {NAV.map(({ key, label, href, Icon }) => {
        const on = key === section;
        return (
          <li key={key}>
            <Link
              href={href}
              onClick={onPick}
              aria-current={on ? "page" : undefined}
              className={`flex h-11 items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 text-[14px] font-medium ${
                on ? "bg-white text-brand shadow-[0_1px_4px_rgba(0,0,0,0.06)]" : "text-ink hover:bg-white hover:text-brand"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
              <Badge n={counts[key]} />
            </Link>
          </li>
        );
      })}
      <li className="mt-1 border-t border-line pt-1">
        <button
          type="button"
          onClick={() => {
            onPick?.();
            signOut();
          }}
          className="flex h-11 w-full items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 text-[14px] font-medium text-muted hover:bg-white hover:text-brand"
        >
          <LogOut size={18} aria-hidden="true" />
          Выйти
        </button>
      </li>
    </ul>
  );
}

/** Телефон: кнопка с текущим разделом и выпадающий список. */
function SectionMenu({ section, counts }: { section: AccountSection; counts: Counts }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = NAV.find((n) => n.key === section);
  const Icon = current?.Icon ?? MessageCircle;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav ref={ref} aria-label="Разделы кабинета" className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="account-sections"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-full items-center gap-2.5 rounded-[12px] bg-surface px-3.5 text-[15px] font-semibold"
      >
        <Icon size={18} aria-hidden="true" className="text-brand" />
        <span className="min-w-0 truncate">{current?.label ?? TITLES[section]}</span>
        <span className="ml-auto text-[12px] font-normal text-muted">Разделы</span>
        <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-muted motion-safe:transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div id="account-sections" className="absolute inset-x-0 top-full z-30 mt-2 rounded-[14px] border border-line bg-surface p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
          <SectionList section={section} counts={counts} onPick={() => setOpen(false)} />
        </div>
      ) : null}
    </nav>
  );
}

import Link from "next/link";
import {
  ClipboardList,
  Heart,
  Mail,
  PhoneCall,
  Search,
  User,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { CartLink } from "@/components/cart/cart-badge";
import { FavoritesLink } from "@/components/favorites/favorites-link";
import { FAVORITES_HREF } from "@/lib/favorites/store";
import { site } from "@/content/site";
import { BrandLogo } from "./brand-logo";
import { StickyBar } from "./sticky-bar";
import { TopBar } from "./top-bar";
import { CategoryNav } from "./category-nav";
import { CategoryNavGate } from "./category-nav-gate";
import { CatalogMenu } from "./catalog-menu";
import { CatalogRows } from "./catalog-panel";

const iconBtn =
  "grid size-12 shrink-0 place-items-center rounded-[10px] bg-white/10 text-white hover:bg-white/20";

const circle =
  "grid shrink-0 place-items-center rounded-full bg-brand-soft text-brand motion-safe:transition-colors motion-safe:duration-150 hover:bg-brand hover:text-white";

const actions: { label: string; href: string; Icon: typeof User; mobile: boolean; tip?: boolean }[] = [
  { label: "Профиль", href: "/account", Icon: User, mobile: true },
  { label: "Избранное", href: FAVORITES_HREF, Icon: Heart, mobile: true },
  { label: "Бриф на разработку индивидуальной продукции", href: "/brief", Icon: ClipboardList, mobile: false, tip: true },
];

const menu = [
  ...site.topbar.links,
  { label: "Распродажа недели", href: "/#weekly-sale" },
];

export function SiteHeader() {
  return (
    <>
    <header>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-md focus:outline-ink"
      >
        Перейти к содержимому
      </a>
      <TopBar />
      <Container className="flex h-[72px] items-center justify-between gap-6 md:h-[88px]">
        <Link href="/" aria-label="ProStyle — на главную" className="shrink-0">
          <BrandLogo className="h-auto w-[130px] md:w-[170px]" />
        </Link>
        <nav aria-label="Основное меню" className="hidden lg:block">
          <ul className="flex items-center gap-5 text-[15px] font-semibold xl:gap-10 xl:text-base">
            {menu.map((l, i) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`whitespace-nowrap hover:text-brand ${i === menu.length - 1 ? "text-brand hover:underline" : ""}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href={site.phone.href}
          aria-label={site.phone.label}
          className={`${circle} size-10 lg:hidden`}
        >
          <PhoneCall size={20} strokeWidth={2} aria-hidden />
        </a>
        <div className="hidden shrink-0 items-center gap-3 whitespace-nowrap lg:flex">
          <a
            href={site.phone.href}
            tabIndex={-1}
            aria-hidden
            className={`${circle} size-11`}
          >
            <PhoneCall size={20} strokeWidth={2} aria-hidden />
          </a>
          <div>
            <a href={site.phone.href} className="block text-lg font-semibold leading-tight text-ink hover:text-brand">
              {site.phone.label}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="mt-0.5 flex items-center gap-1.5 text-[13px] leading-tight text-muted hover:text-brand"
            >
              <Mail size={13} aria-hidden />
              {site.email}
            </a>
          </div>
        </div>
      </Container>
    </header>
    <StickyBar>
      <Container>
        <div className="relative flex flex-wrap items-center gap-3 rounded-[14px] bg-navy p-2 md:flex-nowrap [&_a:focus-visible]:outline-white">
          <Link
            href="/"
            aria-label="ProStyle — на главную"
            className="invisible -mr-3 grid h-10 w-0 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-white opacity-0 motion-safe:transition-[width,margin,opacity] motion-safe:duration-200 group-data-[stuck=true]/bar:visible group-data-[stuck=true]/bar:mr-0 group-data-[stuck=true]/bar:w-10 group-data-[stuck=true]/bar:opacity-100 md:h-12 md:w-0 md:group-data-[stuck=true]/bar:w-12"
          >
            <svg viewBox="0 0 173.02 173.3" width="26" height="26" aria-hidden focusable="false" className="shrink-0">
              <path d="M159.666 66.2432V139.026C159.666 148.461 155.811 157.032 149.604 163.236C143.395 169.441 134.821 173.294 125.383 173.294H34.2833C24.8443 173.294 16.2701 169.442 10.0624 163.237C3.85384 157.032 0 148.462 0 139.026V47.9674C0 38.5323 3.85384 29.9622 10.0615 23.7563C16.2701 17.5511 24.8443 13.6992 34.2833 13.6992H107.099V36.5452H34.2833C31.1529 36.5452 28.2973 37.8336 26.2212 39.9088C24.1454 41.984 22.8561 44.8383 22.8561 47.9674V139.026C22.8561 142.155 24.1454 145.009 26.222 147.084C28.2981 149.159 31.1529 150.448 34.2833 150.448H125.383C128.513 150.448 131.368 149.158 133.444 147.083C135.52 145.008 136.81 142.155 136.81 139.026V66.2432H159.666Z" fill="#444551"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M129.59 0H166.16C169.931 0 173.016 3.08323 173.016 6.85281V43.4057C173.016 47.1755 169.931 50.2585 166.16 50.2585H129.59C125.819 50.2585 122.734 47.1755 122.734 43.4057V6.85281C122.734 3.08323 125.819 0 129.59 0Z" fill="#65B137"/>
            </svg>
          </Link>
          <CatalogMenu rows={<CatalogRows />} />
          <form
            action="/search"
            role="search"
            className="order-last flex h-12 min-w-0 w-full items-center overflow-hidden rounded-[10px] bg-white focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-ink md:order-none md:w-auto md:flex-1"
          >
            <input
              type="search"
              name="q"
              aria-label="Поиск по товарам"
              placeholder="Поиск по товарам и артикулам"
              className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-faint"
            />
            <button
              type="submit"
              aria-label="Найти"
              className="grid size-12 shrink-0 place-items-center rounded-r-[10px] bg-field text-ink hover:bg-field-hover focus-visible:outline-ink focus-visible:-outline-offset-2"
            >
              <Search size={20} aria-hidden />
            </button>
          </form>
          <ul className="ml-auto flex items-center gap-3 md:ml-0">
            {actions.map(({ label, href, Icon, mobile, tip }) => (
              <li key={href} className={`${mobile ? "" : "hidden md:block"} ${tip ? "group relative" : ""}`}>
                {href === FAVORITES_HREF ? (
                  <FavoritesLink className={iconBtn} />
                ) : (
                  <Link href={href} aria-label={label} title={tip ? undefined : label} className={iconBtn}>
                    <Icon size={22} aria-hidden />
                  </Link>
                )}
                {tip ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-max max-w-[260px] rounded-md bg-ink px-3 py-2 text-[12px] font-medium leading-snug text-white opacity-0 shadow-lg motion-safe:transition-opacity motion-safe:duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
                  >
                    {label}
                  </span>
                ) : null}
              </li>
            ))}
            <li>
              <CartLink className="grid size-12 place-items-center rounded-[10px] bg-white/10 text-white hover:bg-white/20 md:flex md:h-12 md:w-[152px] md:items-center md:justify-center md:gap-2 md:px-3" />
            </li>
          </ul>
        </div>
      </Container>
    </StickyBar>
    <CategoryNavGate>
      <CategoryNav />
    </CategoryNavGate>
    </>
  );
}

import { asset } from "@/lib/asset";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Heart,
  PhoneCall,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { site } from "@/content/site";
import { TopBar } from "./top-bar";
import { CategoryNav } from "./category-nav";
import { CatalogMenu } from "./catalog-menu";
import { CatalogDesktop, CatalogSheet } from "./catalog-panel";

const iconBtn =
  "grid size-12 shrink-0 place-items-center rounded-[10px] bg-white/10 text-white hover:bg-white/20";

const actions = [
  { label: "Профиль", href: "/account", Icon: User, mobile: true },
  { label: "Избранное", href: "/account/favorites", Icon: Heart, mobile: false },
  { label: "Презентация", href: "/presentation", Icon: FileText, mobile: false },
];

const menu = [
  ...site.topbar.links,
  { label: "Распродажа недели", href: "/#weekly-sale" },
];

export function SiteHeader() {
  return (
    <header>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-md focus:outline-ink"
      >
        Перейти к содержимому
      </a>
      <TopBar />
      <Container className="flex h-[72px] items-center justify-between gap-6 md:h-[88px]">
        <Link href="/" className="shrink-0">
          <Image
            src={asset("/images/brand/logo.svg")}
            alt="ProStyle — бизнес-подарки"
            width={170}
            height={41}
            loading="eager"
            fetchPriority="low"
            className="h-auto w-[130px] md:w-[170px]"
          />
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
          className="grid size-10 shrink-0 place-items-center text-brand lg:hidden"
        >
          <PhoneCall size={30} strokeWidth={1.75} aria-hidden />
        </a>
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <PhoneCall size={36} strokeWidth={1.75} className="text-brand" aria-hidden />
          <div className="leading-tight">
            <a href={site.phone.href} className="block text-lg font-bold hover:text-brand">
              {site.phone.label}
            </a>
            <a href={`mailto:${site.email}`} className="block whitespace-nowrap text-sm text-muted hover:text-brand">
              {site.email}
            </a>
          </div>
        </div>
      </Container>
      <Container>
        <div className="relative z-[45] flex flex-wrap items-center gap-3 rounded-[14px] bg-navy p-2 md:flex-nowrap [&_a:focus-visible]:outline-white">
          <CatalogMenu desktop={<CatalogDesktop />} sheet={<CatalogSheet />} />
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
            {actions.map(({ label, href, Icon, mobile }) => (
              <li key={href} className={mobile ? "" : "hidden md:block"}>
                <Link href={href} aria-label={label} title={label} className={iconBtn}>
                  <Icon size={22} aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/cart"
                aria-label="Корзина"
                className="grid size-12 place-items-center rounded-[10px] bg-white/10 text-white hover:bg-white/20 md:flex md:h-12 md:w-auto md:items-center md:gap-2 md:px-5"
              >
                <ShoppingCart size={22} aria-hidden />
                <span className="hidden text-[15px] font-semibold md:inline">Корзина</span>
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <CategoryNav />
    </header>
  );
}

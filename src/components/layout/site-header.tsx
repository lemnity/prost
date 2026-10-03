import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Heart,
  LayoutGrid,
  Phone,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { site } from "@/content/site";
import { TopBar } from "./top-bar";
import { CategoryNav } from "./category-nav";

const actions = [
  { label: "Избранное", href: "/account/favorites", Icon: Heart, mobile: false },
  { label: "Презентация", href: "/presentation", Icon: FileText, mobile: false },
  { label: "Профиль", href: "/account", Icon: User, mobile: true },
  { label: "Корзина", href: "/cart", Icon: ShoppingCart, mobile: true },
];

export function SiteHeader() {
  return (
    <header className="header-band pb-6 md:pb-8">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-md"
      >
        Перейти к содержимому
      </a>
      <TopBar />
      <Container className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3 md:h-[84px] md:flex-nowrap md:gap-x-5 md:py-0 lg:gap-x-6">
        <Link href="/" className="shrink-0 rounded-[12px] bg-white px-3 py-2">
          <Image
            src="/images/brand/logo.svg"
            alt="ProStyle — бизнес-подарки"
            width={170}
            height={41}
            loading="eager"
            fetchPriority="low"
            className="h-auto w-[110px] md:w-[150px]"
          />
        </Link>
        <Link
          href="/catalog"
          className="ml-auto inline-flex h-12 shrink-0 items-center gap-2 rounded-[12px] bg-white px-3 text-[15px] font-medium text-ink hover:bg-white/90 md:ml-0 md:px-5"
        >
          <LayoutGrid size={20} aria-hidden />
          <span className="sr-only md:not-sr-only">Каталог</span>
        </Link>
        <form
          action="/search"
          role="search"
          className="order-last flex h-12 min-w-0 w-full items-center rounded-[12px] bg-white pl-4 pr-1 md:order-none md:flex-1 focus-within:ring-2 focus-within:ring-white/60"
        >
          <input
            type="search"
            name="q"
            aria-label="Поиск по товарам"
            placeholder="Поиск по товарам и артикулам"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            aria-label="Найти"
            className="grid size-10 place-items-center rounded-[10px] bg-brand text-white hover:bg-brand-hover"
          >
            <Search size={18} aria-hidden />
          </button>
        </form>
        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <Phone size={22} className="text-white" aria-hidden />
          <div className="leading-tight">
            <a href={site.phone.href} className="block text-sm font-semibold text-white hover:underline">
              {site.phone.label}
            </a>
            <Link href="/contact-us#callback" className="text-xs text-white hover:underline">
              Заказать звонок
            </Link>
          </div>
        </div>
        <ul className="flex shrink-0 items-center gap-4 md:ml-auto lg:ml-0 lg:gap-6">
          {actions.map(({ label, href, Icon, mobile }) => (
            <li key={href} className={mobile ? "" : "hidden md:block"}>
              <Link
                href={href}
                aria-label={label}
                className="flex flex-col items-center gap-1 text-white hover:text-white/80"
              >
                <Icon size={24} strokeWidth={1.6} aria-hidden />
                <span className="hidden text-[11px] text-white lg:block">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
      <CategoryNav />
    </header>
  );
}

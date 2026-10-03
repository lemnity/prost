import Image from "next/image";
import Link from "next/link";
import {
  AlignJustify,
  FileText,
  Heart,
  Menu,
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
    <header>
      <TopBar />
      <Container className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3 md:h-[84px] md:flex-nowrap md:gap-x-5 md:py-0 lg:gap-x-6">
        <Link href="/" className="shrink-0">
          <Image
            src="/images/brand/logo.svg"
            alt="ProStyle — бизнес-подарки"
            width={170}
            height={41}
            priority
            className="h-auto w-[130px] md:w-[170px]"
          />
        </Link>
        <Link
          href="/catalog"
          className="ml-auto inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-hover md:ml-0 md:px-5"
        >
          <Menu size={16} aria-hidden />
          <span className="sr-only md:not-sr-only">Каталог</span>
          <AlignJustify size={16} aria-hidden className="hidden md:block" />
        </Link>
        <form
          action="/search"
          role="search"
          className="order-last flex h-11 min-w-0 w-full items-center rounded-[10px] bg-surface pl-4 pr-1 md:order-none md:max-w-[460px] md:flex-1"
        >
          <input
            type="search"
            name="q"
            aria-label="Поиск по товарам"
            placeholder="Поиск по товарам, категориям и артикулам..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            aria-label="Найти"
            className="grid size-10 place-items-center text-ink hover:text-brand"
          >
            <Search size={20} aria-hidden />
          </button>
        </form>
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Phone size={22} className="text-brand" aria-hidden />
          <div className="leading-tight">
            <a href={site.phone.href} className="block text-sm font-semibold hover:text-brand">
              {site.phone.label}
            </a>
            <Link href="/contact-us#callback" className="text-xs text-brand hover:underline">
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
                className="flex flex-col items-center gap-1 text-ink hover:text-brand"
              >
                <Icon size={22} strokeWidth={1.6} aria-hidden />
                <span className="hidden text-[11px] text-muted lg:block">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
      <CategoryNav />
    </header>
  );
}

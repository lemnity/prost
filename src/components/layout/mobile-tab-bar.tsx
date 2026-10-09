"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/cart/use-cart";
import { useFavorites } from "@/lib/favorites/use-favorites";
import { FAVORITES_HREF } from "@/lib/favorites/store";
import { useSession } from "@/lib/account/use-account";

/** Нижняя панель навигации на телефоне (как в мобильных магазинах). */
export function MobileTabBar() {
  const path = usePathname();
  const cart = useCart().length;
  const favs = useFavorites().length;
  const session = useSession();
  if (path.startsWith("/admin")) return null;

  const tabs = [
    { href: "/", label: "Главная", Icon: House, on: path === "/" },
    { href: "/catalog", label: "Каталог", Icon: LayoutGrid, on: path.startsWith("/catalog") },
    { href: FAVORITES_HREF, label: "Избранное", Icon: Heart, on: path.startsWith(FAVORITES_HREF), badge: favs },
    { href: "/cart", label: "Корзина", Icon: ShoppingCart, on: path === "/cart" || path === "/checkout" || path === "/account/cart", badge: cart },
    {
      href: session ? "/account" : "/account/login",
      label: "Кабинет",
      Icon: User,
      on: path.startsWith("/account") && !path.startsWith(FAVORITES_HREF) && path !== "/account/cart",
      dot: !!session,
    },
  ];

  return (
    <nav
      aria-label="Быстрая навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, Icon, on, badge, dot }) => (
          <li key={label}>
            <Link
              href={href}
              aria-current={on ? "page" : undefined}
              aria-label={badge ? `${label}: ${badge}` : label}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${on ? "text-brand" : "text-muted"}`}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={on ? 2.25 : 1.75} aria-hidden="true" />
                {badge ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white"
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
                {dot ? <span aria-hidden="true" className="absolute -right-1 -top-0.5 size-2 rounded-full bg-[#3BB273] ring-2 ring-white" /> : null}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

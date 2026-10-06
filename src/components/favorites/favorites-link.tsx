"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { plural } from "@/lib/plural";
import { FAVORITES_HREF } from "@/lib/favorites/store";
import { useFavorites } from "@/lib/favorites/use-favorites";

/** Ссылка «Избранное» в шапке со счётчиком. Сервер рендерит без бейджа. */
export function FavoritesLink({ className }: { className: string }) {
  const n = useFavorites().length;
  return (
    <Link
      href={FAVORITES_HREF}
      aria-label={n ? `Избранное, ${n} ${plural("item", n)}` : "Избранное"}
      title="Избранное"
      className={className}
    >
      <span className="relative grid place-items-center">
        <Heart size={22} aria-hidden />
        {n > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-3 -top-3 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none text-white"
          >
            {n > 99 ? "99+" : n}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

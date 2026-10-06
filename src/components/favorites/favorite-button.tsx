"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite, type FavoriteItem } from "@/lib/favorites/store";
import { useFavorites } from "@/lib/favorites/use-favorites";

/** card — иконка в углу карточки; detail — круглая кнопка на фото товара. */
const STYLE = {
  card: "size-8",
  detail: "size-10 rounded-full bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
} as const;

export function FavoriteButton({
  item,
  variant = "card",
  className = "",
}: {
  item: Omit<FavoriteItem, "addedAt">;
  variant?: keyof typeof STYLE;
  className?: string;
}) {
  const active = useFavorites().some((i) => i.id === item.id);
  const [announce, setAnnounce] = useState("");
  return (
    <>
      <button
        type="button"
        aria-pressed={active}
        aria-label={active ? "Убрать из избранного" : "Добавить в избранное"}
        title={active ? "В избранном" : "В избранное"}
        onClick={() => {
          const on = toggleFavorite(item);
          setAnnounce("");
          setTimeout(() => setAnnounce(on ? "Добавлено в избранное" : "Удалено из избранного"), 50);
        }}
        className={`inline-flex items-center justify-center motion-safe:transition-colors ${STYLE[variant]} ${active ? "text-brand" : "text-muted hover:text-brand"} ${className}`}
      >
        <Heart size={variant === "detail" ? 20 : 18} fill={active ? "currentColor" : "none"} aria-hidden="true" />
      </button>
      <span role="status" className="sr-only">
        {announce}
      </span>
    </>
  );
}

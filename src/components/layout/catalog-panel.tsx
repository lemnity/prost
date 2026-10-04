import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCatalogTree } from "@/lib/catalog";
import { categoryIcon } from "./catalog-icons";

/**
 * Серверная часть мега-меню: только 20 верхних категорий (ссылки для SEO и
 * навигации). Подкатегории и «Товар дня» подгружаются из /catalog-menu.json.
 */
export async function CatalogRows() {
  const tree = await getCatalogTree();
  return (
    <ul
      className="max-h-(--menu-max-h) w-[300px] shrink-0 overflow-y-auto overscroll-contain border-r border-line py-2"
      data-rows
    >
      {tree.map((c, i) => {
        const Icon = categoryIcon(c.id);
        return (
          <li key={c.id}>
            <Link
              href={c.href}
              data-row={i}
              data-active={i === 0}
              className="group flex h-11 items-center gap-3 border-b border-line px-5 text-[15px] text-ink data-[active=true]:bg-surface data-[active=true]:text-brand"
            >
              <Icon size={22} aria-hidden className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              {c.children.length > 0 && (
                <ChevronRight size={16} aria-hidden className="shrink-0 text-faint" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

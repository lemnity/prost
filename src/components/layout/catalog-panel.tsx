import Link from "next/link";
import {
  Baby,
  Briefcase,
  ChevronRight,
  Coffee,
  Gem,
  Gift,
  Headphones,
  HeartPulse,
  House,
  Megaphone,
  NotebookPen,
  Package,
  PartyPopper,
  PenLine,
  Plane,
  Shirt,
  ShoppingBag,
  Trophy,
  TreePine,
  Umbrella,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { getCatalogTree } from "@/lib/catalog";

const icons: Record<string, LucideIcon> = {
  "promo-odezhda": Shirt,
  "podarochnye-nabory": Gift,
  ejednevniki: NotebookPen,
  posuda: Coffee,
  elektronika: Headphones,
  sumki: ShoppingBag,
  upakovka: Package,
  dom: House,
  ruchki: PenLine,
  zonty: Umbrella,
  personalnye: Briefcase,
  nagrady: Trophy,
  "puteshestvie-i-otdy-x": Plane,
  promo: Megaphone,
  vip: Gem,
  "suveniry-k-prazdnikam": PartyPopper,
  "novyy-god": TreePine,
  chasy: Watch,
  "uhod-i-zdorovie": HeartPulse,
  detyam: Baby,
};

/** Серверная разметка мега-меню (десктоп). */
export async function CatalogDesktop() {
  const tree = await getCatalogTree();
  return (
    <nav aria-label="Каталог" className="flex" data-catalog-panel>
      <ul
        className="max-h-[calc(100vh-250px)] w-[300px] shrink-0 overflow-y-auto border-r border-line py-2"
        data-rows
      >
        {tree.map((c, i) => {
          const Icon = icons[c.id] ?? Package;
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
                  <ChevronRight
                    size={16}
                    aria-hidden
                    className="shrink-0 text-faint"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="sticky top-0 max-h-[calc(100vh-250px)] min-w-0 flex-1 self-start overflow-y-auto p-8">
        {tree.map((c, i) => (
          <section
            key={c.id}
            data-pane={i}
            hidden={i !== 0}
            aria-label={c.title}
          >
            <Link
              href={c.href}
              className="mb-6 flex items-baseline gap-4 text-xl font-semibold text-ink hover:text-brand"
            >
              {c.title}
              <span className="text-sm font-normal text-brand">
                Все товары →
              </span>
            </Link>
            <ul className="columns-3 gap-8 text-sm">
              {c.children.map((s) => (
                <li key={s.href} className="break-inside-avoid">
                  <Link
                    href={s.href}
                    data-sub
                    className="block py-1.5 text-ink hover:text-brand"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}

/** Серверная разметка мега-меню (мобильный лист). */
export async function CatalogSheet() {
  const tree = await getCatalogTree();
  return (
    <nav aria-label="Каталог">
      <ul>
        {tree.map((c) => {
          const Icon = icons[c.id] ?? Package;
          const head = (
            <>
              <Icon size={22} aria-hidden className="shrink-0" />
              <span className="min-w-0 flex-1">{c.title}</span>
            </>
          );
          return (
            <li key={c.id} className="border-b border-line">
              {c.children.length === 0 ? (
                <Link
                  href={c.href}
                  className="flex min-h-14 items-center gap-3 px-4 text-base text-ink"
                >
                  {head}
                </Link>
              ) : (
                <details className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 text-base text-ink [&::-webkit-details-marker]:hidden">
                    {head}
                    <ChevronRight
                      size={18}
                      aria-hidden
                      className="shrink-0 text-faint transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <ul className="bg-surface px-4 py-2 pl-[52px]">
                    <li>
                      <Link
                        href={c.href}
                        className="block py-2.5 text-sm font-semibold text-brand"
                      >
                        Все товары →
                      </Link>
                    </li>
                    {c.children.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          className="block py-2.5 text-sm text-ink"
                        >
                          {s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

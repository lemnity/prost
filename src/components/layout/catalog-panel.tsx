import { asset } from "@/lib/asset";
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
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Countdown } from "@/components/home/countdown";
import { getSaleRemaining } from "@/lib/sale";
import { getCatalogTree, getProductOfDay } from "@/lib/catalog";

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
  const dayLeft = getSaleRemaining(new Date(), "day");
  const potd = await Promise.all(tree.map((c) => getProductOfDay(c.id)));
  return (
    <nav aria-label="Каталог" className="flex" data-catalog-panel>
      <ul
        className="max-h-(--menu-max-h) w-[300px] shrink-0 overflow-y-auto overscroll-contain border-r border-line py-2"
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
      <div className="flex max-h-(--menu-max-h) min-w-0 flex-1 flex-col self-start overflow-y-auto overscroll-contain p-8">
        {tree.map((c, i) => (
          <section
            key={c.id}
            data-pane={i}
            hidden={i !== 0}
            aria-label={c.title}
            className="min-h-0 flex-1 flex-col [&:not([hidden])]:flex"
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
            {(() => {
              const p = c.children.length <= 12 ? potd[i] : null;
              const list = (
                <ul
                  className={`${p ? "columns-2" : "columns-3"} min-w-0 flex-1 gap-8 self-start text-sm`}
                >
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
              );
              if (!p) return list;
              return (
                <div className="flex min-h-0 flex-1 items-stretch gap-8">
                  {list}
                  <aside
                    aria-label="Товар дня"
                    className="flex max-h-full min-h-0 w-[280px] shrink-0 flex-col gap-3 rounded-[16px] border border-line bg-white p-4"
                  >
                    <div className="flex shrink-0 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                          <Sparkles size={14} aria-hidden />
                          Товар дня
                        </p>
                        <Countdown initial={dayLeft} target="day" />
                      </div>
                      <p
                        aria-hidden="true"
                        className="text-[11px] leading-tight text-muted"
                      >
                        До конца предложения
                      </p>
                    </div>
                    <div className="relative min-h-[96px] w-full max-h-[220px] flex-1 basis-[220px] overflow-hidden rounded-[12px] bg-surface">
                      <Image
                        src={asset(p.image)}
                        alt={p.title}
                        fill
                        sizes="280px"
                        className="object-contain p-3 mix-blend-multiply"
                      />
                    </div>
                    <p className="line-clamp-2 shrink-0 text-sm text-ink">
                      {p.title}
                    </p>
                    <p className="shrink-0 text-base font-bold leading-none text-ink">
                      от {p.priceFrom.toLocaleString("ru-RU")} ₽
                    </p>
                    <Link
                      href={p.url}
                      className="flex h-10 shrink-0 items-center justify-center rounded-[10px] bg-brand text-sm font-semibold text-white hover:bg-brand-hover"
                    >
                      Подробнее
                    </Link>
                  </aside>
                </div>
              );
            })()}
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { Countdown } from "@/components/home/countdown";
import { asset } from "@/lib/asset";
import type { MenuData } from "@/lib/catalog/menu";
import type { SaleRemaining } from "@/lib/sale";
import { categoryIcon } from "./catalog-icons";

/** Правая область десктоп-панели: подкатегории и «Товар дня». */
export function CatalogPanes({
  data,
  active,
  dayLeft,
}: {
  data: MenuData | null;
  active: number;
  dayLeft: SaleRemaining | null;
}) {
  return (
    <div className="flex max-h-(--menu-max-h) min-w-0 flex-1 flex-col self-start overflow-y-auto overscroll-contain p-8">
      {!data ? (
        <PanesSkeleton />
      ) : (
        data.tree.map((c, i) => {
          const p = data.potd[c.id];
          const list = (
            <ul className={`${p ? "columns-2" : "columns-3"} min-w-0 flex-1 gap-8 self-start text-sm`}>
              {c.children.map((s) => (
                <li key={s.href} className="break-inside-avoid">
                  <Link href={s.href} data-sub className="block py-1.5 text-ink hover:text-brand">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          );
          return (
            <section
              key={c.id}
              data-pane={i}
              hidden={i !== active}
              aria-label={c.title}
              className="min-h-0 flex-1 flex-col [&:not([hidden])]:flex"
            >
              <Link
                href={c.href}
                className="mb-6 flex items-baseline gap-4 text-xl font-semibold text-ink hover:text-brand"
              >
                {c.title}
                <span className="text-sm font-normal text-brand">Все товары →</span>
              </Link>
              {!p ? (
                list
              ) : (
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
                        {dayLeft ? <Countdown initial={dayLeft} target="day" /> : null}
                      </div>
                      <p aria-hidden="true" className="text-[11px] leading-tight text-muted">
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
                    <p className="line-clamp-2 shrink-0 text-sm text-ink">{p.title}</p>
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
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

function PanesSkeleton() {
  return (
    <div aria-busy="true" aria-label="Загрузка" className="animate-pulse motion-reduce:animate-none">
      <div className="mb-6 h-6 w-56 rounded bg-surface" />
      <div className="grid grid-cols-3 gap-x-8 gap-y-3">
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} className="h-4 rounded bg-surface" style={{ width: `${60 + ((i * 17) % 35)}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Мобильный лист каталога. */
export function CatalogSheetContent({ data }: { data: MenuData | null }) {
  if (!data) {
    return (
      <div aria-busy="true" aria-label="Загрузка" className="animate-pulse motion-reduce:animate-none">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex min-h-14 items-center gap-3 border-b border-line px-4">
            <div className="size-[22px] rounded bg-surface" />
            <div className="h-4 rounded bg-surface" style={{ width: `${40 + ((i * 13) % 35)}%` }} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <nav aria-label="Каталог">
      <ul>
        {data.tree.map((c) => {
          const Icon = categoryIcon(c.id);
          const head = (
            <>
              <Icon size={22} aria-hidden className="shrink-0" />
              <span className="min-w-0 flex-1">{c.title}</span>
            </>
          );
          return (
            <li key={c.id} className="border-b border-line">
              {c.children.length === 0 ? (
                <Link href={c.href} className="flex min-h-14 items-center gap-3 px-4 text-base text-ink">
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
                      <Link href={c.href} className="block py-2.5 text-sm font-semibold text-brand">
                        Все товары →
                      </Link>
                    </li>
                    {c.children.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} className="block py-2.5 text-sm text-ink">
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

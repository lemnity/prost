"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export type SectionLink = { title: string; href: string; active: boolean; count?: number };

/** Выбор раздела на мобильных и планшетах (переход по смене значения). */
export function SectionSelect({ items }: { items: SectionLink[] }) {
  const router = useRouter();
  const current = items.find((i) => i.active) ?? items[0];
  return (
    <label className="relative flex h-11 items-center gap-2 rounded-[10px] bg-white pl-3.5 pr-4 text-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.06),0_2px_8px_rgba(16,24,40,0.08)] ring-1 ring-line focus-within:ring-brand">
      <span className="shrink-0 text-muted">Раздел:</span>
      <span className="min-w-0 flex-1 truncate font-semibold text-ink">{current.title}</span>
      <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-muted" />
      <select
        aria-label="Раздел каталога"
        value={current.href}
        onChange={(e) => router.push(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {items.map((i) => (
          <option key={i.href} value={i.href}>
            {i.title}
            {i.count ? ` (${i.count})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

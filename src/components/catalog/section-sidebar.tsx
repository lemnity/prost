import Link from "next/link";
import type { SectionLink } from "./section-select";

const VISIBLE = 12;

function Item({ item }: { item: SectionLink }) {
  const empty = !item.active && !item.count;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={item.active ? "page" : undefined}
        className={`relative flex items-center gap-2 rounded-lg py-2 pl-3 pr-2 text-[14px] leading-snug transition-colors ${
          item.active
            ? "bg-brand-soft font-semibold text-brand before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand"
            : `${empty ? "text-ink/45" : "text-ink"} hover:bg-surface hover:text-brand`
        }`}
      >
        <span className="min-w-0 flex-1">{item.title}</span>
        {item.count ? (
          <span className={`shrink-0 text-[12px] tabular-nums ${item.active ? "text-brand/70" : "text-faint"}`}>
            {item.count}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

/** Левая колонка «Разделы» (lg+). Без JS: «Показать все» через <details>. */
export function SectionSidebar({ items }: { items: SectionLink[] }) {
  const head = items.slice(0, VISIBLE);
  const rest = items.slice(VISIBLE);
  const activeHidden = rest.some((i) => i.active);
  return (
    <nav
      aria-label="Разделы"
      className="sticky top-24 max-h-[calc(100vh-112px)] overflow-y-auto overscroll-contain rounded-[10px] border border-line bg-white p-3"
    >
      <p className="px-3 pb-2 pt-1 text-[15px] font-bold">Разделы</p>
      <ul className="space-y-0.5">
        {head.map((i) => (
          <Item key={i.href} item={i} />
        ))}
      </ul>
      {rest.length ? (
        <details open={activeHidden} className="group flex flex-col">
          <summary className="order-last mt-1 cursor-pointer list-none rounded-lg px-3 py-2 text-[13px] font-medium text-brand hover:text-brand-hover [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Показать все ({items.length})</span>
            <span className="hidden group-open:inline">Свернуть</span>
          </summary>
          <ul className="mt-0.5 space-y-0.5">
            {rest.map((i) => (
              <Item key={i.href} item={i} />
            ))}
          </ul>
        </details>
      ) : null}
    </nav>
  );
}

import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="text-[13px] text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-2">
              {i > 0 ? <span aria-hidden="true">/</span> : null}
              {last || !c.href ? (
                <span aria-current={last ? "page" : undefined} className={last ? "line-clamp-1 text-ink" : undefined}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="hover:text-brand">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

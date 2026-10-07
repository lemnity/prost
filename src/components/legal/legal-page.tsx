import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getLegal, legalLinks, type LegalBlock } from "@/lib/legal";

function Block({ b }: { b: LegalBlock }) {
  switch (b.type) {
    case "h2":
      return <h2 className="mt-8 text-[20px] font-bold leading-tight md:text-[22px]">{b.text}</h2>;
    case "h3":
      return <h3 className="mt-6 text-[17px] font-semibold">{b.text}</h3>;
    case "p":
      return <p className="mt-3">{b.text}</p>;
    case "ul":
    case "ol": {
      const L = b.type;
      return (
        <L className={`mt-3 grid gap-1.5 pl-5 ${L === "ul" ? "list-disc" : "list-decimal"} marker:text-brand`}>
          {b.items.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </L>
      );
    }
    case "table":
      return (
        <dl className="mt-4 divide-y divide-line overflow-hidden rounded-[12px] border border-line">
          {b.rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[220px_1fr] sm:gap-4">
              <dt className="font-semibold">{k}</dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      );
  }
}

/** Страница юридического документа с навигацией по остальным документам. */
export function LegalPage({ slug }: { slug: string }) {
  const doc = getLegal(slug);
  const href = `/${slug}`;
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Документы" }, { label: doc.title }]} />
      </Container>
      <Container className="grid items-start gap-8 py-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="max-w-[820px] text-[15px] leading-[1.7] text-ink">
          <h1 className="text-[28px] font-bold leading-[1.15] tracking-tight md:text-[36px]">{doc.title}</h1>
          {doc.blocks.map((b, i) => (
            <Block key={i} b={b} />
          ))}
        </article>
        <nav aria-label="Документы" className="rounded-[14px] bg-surface p-4 lg:sticky lg:top-24">
          <p className="px-2 text-[13px] font-semibold uppercase tracking-wide text-muted">Документы</p>
          <ul className="mt-2 grid gap-0.5">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={l.href === href ? "page" : undefined}
                  className={`block rounded-[8px] px-2 py-2 text-[14px] leading-snug ${l.href === href ? "bg-white font-semibold text-brand" : "hover:bg-white hover:text-brand"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </main>
  );
}

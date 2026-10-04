import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Banknote, Building2, ChevronDown, CreditCard, Globe, Store, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { delivery, type InfoCard } from "@/content/delivery";
import { applications } from "@/content/home";

export const metadata: Metadata = {
  title: "Доставка и оплата — ProStyle",
  description: delivery.lead,
};

const icons = { store: Store, truck: Truck, globe: Globe, building: Building2, card: CreditCard, cash: Banknote } as const;

function Cards({ items }: { items: readonly InfoCard[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {items.map((c) => {
        const Icon = icons[c.icon];
        return (
          <li key={c.title} className="rounded-[10px] bg-surface p-5">
            <Icon size={28} strokeWidth={1.5} aria-hidden="true" className="text-brand" />
            <h3 className="mt-3 text-[17px] font-semibold text-ink">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.text}</p>
            {c.extra ? <p className="mt-2 text-sm font-medium text-ink">{c.extra}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function DeliveryPage() {
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <nav aria-label="Хлебные крошки" className="text-[13px] text-muted">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-brand">Главная</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">Доставка и оплата</li>
          </ol>
        </nav>
        <h1 className="mt-6 text-[30px] font-bold leading-[1.12] tracking-tight md:mt-8 md:text-[44px]">
          Доставка и оплата
        </h1>
        <p className="mt-3 text-[15px] text-muted md:text-[17px]">{delivery.lead}</p>
      </Container>

      <section aria-labelledby="methods-title" className="py-6 md:py-8">
        <Container>
          <SectionHeader id="methods-title" title="Способы получения" />
          <Cards items={delivery.methods} />
        </Container>
      </section>

      <section aria-labelledby="timing-title" className="py-5 md:py-6">
        <Container>
          <SectionHeader
            id="timing-title"
            title={delivery.timing.title}
            link={{ label: "Все виды нанесения", href: "/application-types" }}
          />
          <p className="mb-4 text-[15px] font-medium text-ink">{delivery.timing.lead}</p>
          <ul className="grid gap-x-8 rounded-[10px] bg-surface px-5 py-2 sm:grid-cols-2 lg:grid-cols-3">
            {applications.items.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm">
                <Link href={a.href} className="font-medium text-ink hover:text-brand">{a.title}</Link>
                <span className="shrink-0 text-muted">{a.term.replace("Срок: ", "")}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1 text-[13px] text-muted">
            <ArrowRight size={14} aria-hidden="true" />
            {delivery.timing.note}
          </p>
        </Container>
      </section>

      <section aria-labelledby="pay-title" className="py-5 md:py-6">
        <Container>
          <SectionHeader id="pay-title" title="Оплата" />
          <Cards items={delivery.payments} />
        </Container>
      </section>

      <section aria-labelledby="faq-title" className="py-5 md:py-8">
        <Container>
          <SectionHeader id="faq-title" title="Частые вопросы" />
          <div className="divide-y divide-line rounded-[10px] bg-surface">
            {delivery.faq.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <ConsultationCta />
    </main>
  );
}

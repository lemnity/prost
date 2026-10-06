import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ContactsSection } from "@/components/contacts/contacts-section";
import { company } from "@/content/company";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Контакты — ProStyle",
  description: `${site.address}. ${site.hours}. ${site.phone.label}, ${site.email}.`,
};

const lead = `${site.topbar.center[0]}. ${site.topbar.center[1]}.`;

export default function ContactsPage() {
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <nav aria-label="Хлебные крошки" className="text-[13px] text-muted">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-brand">Главная</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">Контакты</li>
          </ol>
        </nav>
        <h1 className="mt-6 text-[30px] font-bold leading-[1.12] tracking-tight md:mt-8 md:text-[44px]">
          Контакты
        </h1>
        <p className="mt-3 text-[15px] text-muted md:text-[17px]">{lead}</p>
      </Container>

      <ContactsSection />

      <section aria-labelledby="req-title" className="pb-8 pt-2 md:pb-10">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-[10px] border border-line px-5 py-4">
            <div>
              <h2 id="req-title" className="text-[15px] font-semibold text-ink">Реквизиты</h2>
              <p className="mt-0.5 text-sm text-muted">Наименование: {company.name}</p>
            </div>
            <Link href="/about#requisites" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-hover">
              Все реквизиты <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}

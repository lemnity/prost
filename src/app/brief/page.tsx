import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BriefForm } from "@/components/brief/brief-form";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Бриф на разработку индивидуальной продукции — ProStyle",
  description: "Расскажите о задаче — мы подготовим идеи, макеты и расчёт стоимости.",
};

const steps = [
  { t: "Получаем бриф", d: "Менеджер связывается с вами и уточняет детали." },
  { t: "Готовим идеи и макеты", d: "Предлагаем варианты изделий, нанесения и считаем стоимость." },
  { t: "Согласуем и запускаем", d: "После утверждения макета запускаем производство." },
];

export default function BriefPage() {
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Бриф на разработку" }]} />
        <h1 className="mt-6 text-[30px] font-bold leading-[1.12] tracking-tight text-balance md:mt-8 md:text-[44px]">
          Бриф на разработку индивидуальной продукции
        </h1>
        <p className="mt-3 max-w-[60ch] text-[16px] text-muted">
          Расскажите о задаче — мы подготовим идеи, макеты и расчёт стоимости.
        </p>
      </Container>
      <section className="py-6 md:py-8">
        <Container className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <BriefForm />
          <aside aria-labelledby="brief-how" className="rounded-[14px] bg-surface p-5 md:p-6 lg:sticky lg:top-24">
            <h2 id="brief-how" className="text-[18px] font-bold">Как мы работаем с брифом</h2>
            <ol className="mt-4 grid gap-4">
              {steps.map((s, i) => (
                <li key={s.t} className="flex gap-3">
                  <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-semibold text-white">{i + 1}</span>
                  <span className="text-[14px] leading-snug">
                    <span className="block font-semibold text-ink">{s.t}</span>
                    <span className="text-muted">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-5 grid gap-2 border-t border-line pt-4 text-[14px]">
              <a href={site.phone.href} className="inline-flex items-center gap-2 font-medium text-ink hover:text-brand">
                <Phone size={16} aria-hidden="true" className="text-brand" />{site.phone.label}
              </a>
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 font-medium text-ink hover:text-brand">
                <Mail size={16} aria-hidden="true" className="text-brand" />{site.email}
              </a>
            </div>
          </aside>
        </Container>
      </section>
    </main>
  );
}

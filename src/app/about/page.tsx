import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { HowWeWork } from "@/components/home/how-we-work";
import { ApplicationTypes } from "@/components/home/application-types";
import { Reviews } from "@/components/home/reviews";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { company, requisites } from "@/content/company";
import { applications } from "@/content/home";
import { site } from "@/content/site";
import { getPopularCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "О компании — ProStyle",
  description: company.quote,
};

// Координаты адреса (геокодированы один раз), чтобы виджет показал метку.
const MAP_POINT = "65.535297,57.128887";
const mapEmbedUrl = `https://yandex.ru/map-widget/v1/?ll=${MAP_POINT}&z=16&pt=${MAP_POINT},pm2rdm`;
const mapUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(site.address)}`;

export default async function AboutPage() {
  const categories = await getPopularCategories();
  const facts = [
    { value: `${company.yearsOnMarket}+`, label: "лет на рынке" },
    { value: `от ${company.minOrder}`, label: "минимальный заказ" },
    { value: String(applications.items.length), label: "видов нанесения" },
    { value: String(categories.length), label: "категорий каталога" },
  ];
  const contacts = [
    { icon: MapPin, label: "Адрес", node: (
        <a href={mapUrl} target="_blank" rel="noopener" className="hover:text-brand">
          {site.address}
        </a>
      ) },
    { icon: Clock, label: "Режим работы", node: site.hours },
    { icon: Phone, label: "Телефон", node: (
        <a href={site.phone.href} className="hover:text-brand">{site.phone.label}</a>
      ) },
    { icon: Mail, label: "Эл. почта", node: (
        <a href={`mailto:${site.email}`} className="hover:text-brand">{site.email}</a>
      ) },
  ];
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <nav aria-label="Хлебные крошки" className="text-[13px] text-muted">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-brand">Главная</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">О компании</li>
          </ol>
        </nav>
      </Container>

      <section aria-labelledby="about-title" className="py-6 md:py-8">
        <Container className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-10">
          <div>
            <h1 id="about-title" className="text-[30px] font-bold leading-[1.12] tracking-tight md:text-[44px]">
              О компании {company.brand}
            </h1>
            <blockquote className="mt-4 border-l-4 border-brand pl-4 text-[15px] leading-relaxed text-ink/80 md:text-[17px]">
              {company.quote}
            </blockquote>
            <p className="mt-4 text-sm text-muted">
              {site.topbar.center[0]}. {site.topbar.center[1]}.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {facts.map((f) => (
              <li key={f.label} className="rounded-[10px] bg-surface p-5">
                <div className="whitespace-nowrap text-[22px] font-bold leading-none text-brand min-[400px]:text-[26px] md:text-[32px]">{f.value}</div>
                <div className="mt-2 text-sm text-muted">{f.label}</div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <HowWeWork />
      <ApplicationTypes />
      <Reviews />

      <section aria-labelledby="contacts-title" className="py-5 md:py-8">
        <Container>
          <h2 id="contacts-title" className="mb-5 text-[22px] font-bold md:mb-6 md:text-[26px]">
            Контакты и реквизиты
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex h-full flex-col rounded-[10px] bg-surface p-5">
              <ul className="space-y-3">
                {contacts.map(({ icon: Icon, label, node }) => (
                  <li key={label} className="flex items-start gap-3">
                    <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
                    <div>
                      <div className="text-xs text-muted">{label}</div>
                      <div className="text-[15px] font-medium text-ink">{node}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-5 h-[240px] overflow-hidden rounded-[12px] bg-[#E9ECEF] lg:h-auto lg:min-h-[220px] lg:flex-1">
                <iframe
                  src={mapEmbedUrl}
                  title={`Карта: ${site.address}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="size-full border-0"
                />
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener"
                className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand px-6 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
              >
                <MapPin size={18} aria-hidden="true" />
                Открыть на карте
              </a>
            </div>
            <dl className="grid h-full grid-cols-1 gap-x-4 rounded-[10px] bg-surface p-5 sm:grid-cols-[minmax(0,200px)_1fr]">
              {requisites.map((r, i) => {
                const line = i > 0 ? "sm:border-t sm:border-line sm:py-2" : "sm:pb-2 sm:pt-0";
                return (
                  <div key={r.label} className="contents">
                    <dt className={`pt-2 text-sm text-muted ${line}`}>{r.label}</dt>
                    <dd className={`pb-2 text-sm font-medium text-ink ${line}`}>
                      {r.value ?? "—"}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </Container>
      </section>

      <ConsultationCta />
    </main>
  );
}

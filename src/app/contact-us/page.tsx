import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { Container } from "@/components/ui/container";
import { YandexMap, yandexRouteUrl } from "@/components/ui/yandex-map";
import { SocialLinks } from "@/components/layout/social-links";
import { company } from "@/content/company";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Контакты — ProStyle",
  description: `${site.address}. ${site.hours}. ${site.phone.label}, ${site.email}.`,
};

const lead = `${site.topbar.center[0]}. ${site.topbar.center[1]}.`;
const mailAction = `mailto:${site.email}?subject=${encodeURIComponent("Заявка с сайта ProStyle")}`;

const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-[15px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand";

export default function ContactsPage() {
  const cards = [
    {
      icon: MapPin,
      label: "Адрес",
      node: site.address.replace("ул. ", "ул.\u00A0").replace("Пышминская, ", "Пышминская,\u00A0"),
      extra: (
        <a
          href={yandexRouteUrl}
          target="_blank"
          rel="noopener"
          className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-hover"
        >
          Построить маршрут <ArrowRight size={14} aria-hidden="true" />
        </a>
      ),
    },
    { icon: Clock, label: "Режим работы", node: site.hours },
    {
      icon: Phone,
      label: "Телефон",
      node: <a href={site.phone.href} className="hover:text-brand">{site.phone.label}</a>,
    },
    {
      icon: Mail,
      label: "Эл. почта",
      node: <a href={`mailto:${site.email}`} className="break-all hover:text-brand">{site.email}</a>,
    },
  ];
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

      <section aria-label="Как с нами связаться" className="py-6 md:py-8">
        <Container className="grid gap-4 lg:grid-cols-[45fr_55fr] lg:gap-6">
          <div className="flex flex-col">
            <ul className="grid flex-1 gap-4 sm:grid-cols-2 sm:grid-rows-2">
              {cards.map(({ icon: Icon, label, node, extra }) => (
                <li key={label} className="rounded-[14px] bg-surface p-5">
                  <Icon size={24} strokeWidth={1.5} aria-hidden="true" className="text-brand" />
                  <div className="mt-3 text-xs text-muted">{label}</div>
                  <div className="mt-0.5 text-[15px] font-medium text-ink">{node}</div>
                  {extra}
                </li>
              ))}
            </ul>
          </div>
          <YandexMap className="h-[280px] lg:h-auto lg:min-h-[420px]" />
        </Container>
      </section>

      <section id="callback" aria-labelledby="callback-title" className="scroll-mt-24 py-5 md:py-8">
        <Container>
          <h2 id="callback-title" className="text-[22px] font-bold md:text-[26px]">Оставьте заявку</h2>
          <p className="mb-5 mt-2 text-sm text-muted md:mb-6">
            Перезвоним в рабочее время и поможем подобрать подарки под ваш бюджет.
          </p>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:gap-6">
            <form
              action={mailAction}
              method="post"
              encType="text/plain"
              className="grid gap-4 rounded-[10px] bg-surface p-5 md:p-6 sm:grid-cols-2"
            >
              <label className="block text-sm font-medium text-ink">
                Имя <span className="text-brand">*</span>
                <input name="Имя" type="text" required autoComplete="name" className={field} />
              </label>
              <label className="block text-sm font-medium text-ink">
                Телефон <span className="text-brand">*</span>
                <PhoneInput name="Телефон" required className={field} />
              </label>
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Компания
                <input name="Компания" type="text" autoComplete="organization" className={field} />
              </label>
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Комментарий
                <textarea name="Комментарий" rows={4} className={field} />
              </label>
              <label className="flex items-start gap-2.5 text-[13px] text-muted sm:col-span-2">
                <input
                  type="checkbox"
                  name="Согласие"
                  required
                  className="mt-0.5 size-4 shrink-0 accent-[#D02E31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                />
                <span>
                  Согласен на обработку{" "}
                  <Link href="/personal-data-processing" className="text-brand underline hover:text-brand-hover">
                    персональных данных
                  </Link>{" "}
                  <span className="text-brand">*</span>
                </span>
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex h-[52px] w-full items-center justify-center rounded-lg bg-brand px-10 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover sm:w-auto"
                >
                  Отправить заявку
                </button>
                <p className="mt-2 text-xs text-muted">Откроется ваш почтовый клиент с готовым письмом</p>
              </div>
            </form>
            <div className="flex h-full flex-col gap-3">
              <aside className="rounded-[14px] bg-surface p-5 md:p-6">
                <h3 className="text-[17px] font-semibold text-ink">Или позвоните</h3>
                <a href={site.phone.href} className="mt-3 block text-[22px] font-bold text-ink hover:text-brand">
                  {site.phone.label}
                </a>
                <p className="mt-1 text-sm text-muted">{site.hours}</p>
              </aside>
              <aside className="flex-1 rounded-[14px] bg-surface p-5 md:p-6">
                <h3 className="text-[17px] font-semibold text-ink">Или напишите</h3>
                <a href={`mailto:${site.email}`} className="mt-3 block break-all text-[17px] font-bold text-ink hover:text-brand">
                  {site.email}
                </a>
                <h4 className="mb-3 mt-5 text-sm font-semibold text-ink">Мы в соцсетях</h4>
                <SocialLinks size={32} className="gap-3" />
              </aside>
            </div>
          </div>
        </Container>
      </section>

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

"use client";

import { useCallback, useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { YandexMap, yandexRouteUrl } from "@/components/ui/yandex-map";
import { PhoneInput } from "@/components/ui/phone-input";
import { site } from "@/content/site";
import { SocialLinks } from "@/components/layout/social-links";
import { offices, type CityId, type Office } from "@/content/company";

const ids = offices.map((o) => o.id);
const formCities = offices.filter((o) => !o.soon);

const field =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-[15px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand";

function fromHash(): CityId | null {
  const h = window.location.hash.slice(1);
  return (ids as string[]).includes(h) ? (h as CityId) : null;
}

function nbsp(address: string) {
  return address.replace("ул. ", "ул. ").replace(/(Пышминская|переулок),\s/, "$1, ");
}

function Cards({ o }: { o: Office }) {
  const cards: { icon: typeof MapPin; label: string; node: ReactNode; extra?: ReactNode }[] = [
    {
      icon: MapPin,
      label: "Адрес",
      node: nbsp(o.address!),
      extra: (
        <a
          href={yandexRouteUrl(o.point)}
          target="_blank"
          rel="noopener"
          className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-hover"
        >
          Построить маршрут <ArrowRight size={14} aria-hidden="true" />
        </a>
      ),
    },
    { icon: Clock, label: "Режим работы", node: o.hours },
    {
      icon: Phone,
      label: "Телефон",
      node: <a href={o.phone!.href} className="hover:text-brand">{o.phone!.label}</a>,
    },
    {
      icon: Mail,
      label: "Эл. почта",
      node: <a href={`mailto:${o.email}`} className="break-all hover:text-brand">{o.email}</a>,
    },
  ];
  return (
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
  );
}

export function ContactsSection() {
  const [city, setCity] = useState<CityId>("tyumen");
  const [formCity, setFormCity] = useState<CityId>("tyumen");

  const select = useCallback((id: CityId, focus = false) => {
    setCity(id);
    if (id !== "ekaterinburg") setFormCity(id);
    window.history.replaceState(null, "", `#${id}`);
    if (focus) document.getElementById(`tab-${id}`)?.focus();
  }, []);

  useEffect(() => {
    const apply = () => {
      const id = fromHash();
      if (id) {
        setCity(id);
        if (id !== "ekaterinburg") setFormCity(id);
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const onKey = (e: KeyboardEvent, i: number) => {
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % ids.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + ids.length) % ids.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = ids.length - 1;
    if (n >= 0) {
      e.preventDefault();
      select(ids[n], true);
    }
  };

  const target = offices.find((o) => o.id === formCity)!;
  const mailAction = `mailto:${site.email}?subject=${encodeURIComponent(`Заявка с сайта ProStyle — ${target.city}`)}`;

  return (
    <>
      <section aria-label="Как с нами связаться" className="py-6 md:py-8">
        <Container>
          <div role="tablist" aria-label="Город" className="mb-4 flex flex-wrap gap-2">
            {offices.map((o, i) => {
              const active = o.id === city;
              return (
                <button
                  key={o.id}
                  id={`tab-${o.id}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls={`panel-${o.id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => select(o.id)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    active ? "bg-brand text-white" : "bg-surface text-ink hover:bg-[#ECECEA]"
                  }`}
                >
                  {o.city}
                  {o.soon ? (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${active ? "bg-white/25" : "bg-white text-muted"}`}>
                      скоро
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {offices.map((o) => (
            <div
              key={o.id}
              id={`panel-${o.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${o.id}`}
              hidden={o.id !== city}
              className="grid gap-4 lg:grid-cols-[45fr_55fr] lg:gap-6"
            >
              {o.soon ? (
                <div className="rounded-[14px] bg-surface p-6 lg:col-span-2">
                  <h2 className="text-[20px] font-bold text-ink">Скоро откроемся в Екатеринбурге</h2>
                  <p className="mt-2 text-sm text-muted">
                    Пока свяжитесь с нами в Тюмени или Москве.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {formCities.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => select(c.id)}
                        className="inline-flex h-10 items-center rounded-lg border border-brand px-5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
                      >
                        {c.city}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col">
                    <Cards o={o} />
                  </div>
                  {o.id === city ? (
                    <YandexMap
                      point={o.point}
                      title={`Карта: ${o.address}`}
                      className="h-[280px] lg:h-auto lg:min-h-[420px]"
                    />
                  ) : (
                    <div className="hidden" />
                  )}
                </>
              )}
            </div>
          ))}
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
              className="grid gap-4 rounded-[10px] bg-surface p-5 sm:grid-cols-2 md:p-6"
            >
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Город
                <select
                  name="Город"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value as CityId)}
                  className={field}
                >
                  {formCities.map((c) => (
                    <option key={c.id} value={c.id}>{c.city}</option>
                  ))}
                </select>
              </label>
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
                <a href={target.phone!.href} className="mt-3 block text-[22px] font-bold text-ink hover:text-brand">
                  {target.phone!.label}
                </a>
                <p className="mt-1 text-sm text-muted">{target.hours}</p>
              </aside>
              <aside className="flex-1 rounded-[14px] bg-surface p-5 md:p-6">
                <h3 className="text-[17px] font-semibold text-ink">Или напишите</h3>
                <a href={`mailto:${target.email}`} className="mt-3 block break-all text-[17px] font-bold text-ink hover:text-brand">
                  {target.email}
                </a>
                <h4 className="mb-3 mt-5 text-sm font-semibold text-ink">Мы в соцсетях</h4>
                <SocialLinks size={32} className="gap-3" />
              </aside>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

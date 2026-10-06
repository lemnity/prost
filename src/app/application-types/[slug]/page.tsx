import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Layers } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { ApplicationTabs } from "@/components/application-types/application-tabs";
import { asset } from "@/lib/asset";
import {
  applicationTypes,
  catalogHrefFor,
  getApplicationCard,
  getApplicationType,
} from "@/lib/application-types";
import { buttonClass } from "@/components/ui/button";

export const dynamicParams = false;

export function generateStaticParams() {
  return applicationTypes.map((a) => ({ slug: a.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const firstSentence = (s: string) => {
  const m = s.match(/^.+?[.!?](?=\s|$)/);
  return (m ? m[0] : s).trim();
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getApplicationType(slug);
  if (!t) return {};
  return {
    title: `${t.title} — нанесение логотипа | ProStyle`,
    description: firstSentence(t.intro[0] ?? t.title),
  };
}

const img = (slug: string, name: string) => asset(`/images/application-types/${slug}/${name}.webp`);

export default async function ApplicationTypePage({ params }: Props) {
  const { slug } = await params;
  const t = getApplicationType(slug)!;
  const card = getApplicationCard(slug);
  const others = applicationTypes.filter((a) => a.slug !== slug);
  const titleOf = (s: string) => getApplicationCard(s)?.title ?? applicationTypes.find((a) => a.slug === s)!.title;

  const facts = (
    <>
      {card ? (
        <ul className="flex flex-wrap gap-2">
          <li className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] text-ink">
            <Clock size={14} aria-hidden="true" className="text-brand" />
            {card.term}
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] text-ink">
            <Layers size={14} aria-hidden="true" className="text-brand" />
            {card.run}
          </li>
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/contact-us#callback"
          className={buttonClass({ size: "lg", px: "px-7" })}
        >
          Рассчитать нанесение
        </Link>
        <Link
          href={catalogHrefFor(slug)}
          className={buttonClass({ variant: "outline", size: "lg", px: "px-7" })}
        >
          Смотреть товары
        </Link>
      </div>
    </>
  );

  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Виды нанесения", href: "/application-types" },
            { label: t.title },
          ]}
        />
      </Container>

      <section aria-labelledby="apt-title" className="py-6 md:py-8">
        <Container className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-10">
          <div>
            <h1 id="apt-title" className="text-[30px] font-bold leading-[1.12] tracking-tight md:text-[40px]">
              {t.title}
            </h1>
            {t.intro.map((p, i) => (
              <p key={i} className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted">
                {p}
              </p>
            ))}
            <div className="mt-5 lg:hidden">
              {facts}
            </div>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[12px] bg-surface lg:aspect-[4/3]">
            <Image
              src={img(slug, "banner")}
              alt={t.title}
              fill
              priority
              sizes="(min-width:1024px) 55vw, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      </section>

      <section aria-label="Подробно о виде нанесения" className="py-2 md:py-4">
        <Container className="grid items-start gap-8 lg:grid-cols-[minmax(0,800px)_320px] lg:justify-between">
          <div className="min-w-0">
            <ApplicationTabs sections={t.sections} />
          </div>
          <aside aria-label="О виде нанесения" className="hidden lg:sticky lg:top-28 lg:grid lg:gap-4">
            <div className="rounded-[14px] bg-surface p-6">
              {card ? (
                <dl className="grid gap-3 text-[15px]">
                  <div>
                    <dt className="flex items-center gap-1.5 text-[13px] text-muted">
                      <Clock size={14} aria-hidden="true" className="text-brand" />
                      Срок изготовления
                    </dt>
                    <dd className="mt-0.5 font-semibold text-ink">{card.term.replace(/^Срок:\s*/, "")}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-[13px] text-muted">
                      <Layers size={14} aria-hidden="true" className="text-brand" />
                      Тираж
                    </dt>
                    <dd className="mt-0.5 font-semibold text-ink">{card.run.replace(/^Тираж:\s*/, "")}</dd>
                  </div>
                </dl>
              ) : null}
              <div className="mt-5 grid gap-3">
                <Link
                  href="/contact-us#callback"
                  className={buttonClass({ size: "lg", full: true })}
                >
                  Рассчитать нанесение
                </Link>
                <Link
                  href={catalogHrefFor(slug)}
                  className={buttonClass({ variant: "outline", size: "lg", full: true })}
                >
                  Смотреть товары
                </Link>
              </div>
            </div>
            <nav aria-labelledby="apt-others-side" className="rounded-[14px] bg-surface p-6">
              <h2 id="apt-others-side" className="text-[16px] font-bold">Другие виды нанесения</h2>
              <ul className="mt-3 grid gap-0.5">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={`/application-types/${o.slug}`}
                      className="block rounded-md px-2 py-1.5 text-[14px] text-ink transition-colors hover:bg-white hover:text-brand"
                    >
                      {titleOf(o.slug)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </Container>
      </section>

      {t.images.gallery.length ? (
        <section aria-labelledby="apt-gallery" className="py-8 md:py-10">
          <Container>
            <h2 id="apt-gallery" className="text-[22px] font-bold md:text-[26px]">
              Примеры нанесения
            </h2>
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
              {t.images.gallery.map((_, i) => (
                <li key={i} className="relative aspect-[13/12] overflow-hidden rounded-[10px] bg-surface">
                  <Image
                    src={img(slug, `g${i + 1}`)}
                    alt={`${t.title} — пример ${i + 1}`}
                    fill
                    loading="lazy"
                    sizes="(min-width:768px) 25vw, (min-width:640px) 33vw, 50vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      <section aria-labelledby="apt-others" className="pb-4 md:pb-6 lg:hidden">
        <Container>
          <h2 id="apt-others" className="text-[22px] font-bold md:text-[26px]">
            Другие виды нанесения
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/application-types/${o.slug}`}
                  className="inline-flex h-10 items-center rounded-full bg-surface px-4 text-[14px] font-medium text-ink transition-colors hover:bg-brand-soft hover:text-brand"
                >
                  {titleOf(o.slug)}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <ConsultationCta />
    </main>
  );
}

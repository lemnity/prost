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
            {card ? (
              <ul className="mt-4 flex flex-wrap gap-2">
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
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact-us#callback"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-brand px-7 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Рассчитать нанесение
              </Link>
              <Link
                href={catalogHrefFor(slug)}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-surface px-7 text-[15px] font-semibold text-ink transition-colors hover:bg-field-hover"
              >
                Смотреть товары
              </Link>
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
        <Container>
          <ApplicationTabs sections={t.sections} />
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

      <section aria-labelledby="apt-others" className="pb-4 md:pb-6">
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

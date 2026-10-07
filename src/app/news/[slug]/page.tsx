import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { asset } from "@/lib/asset";
import { formatNewsDate, getNews, news, readingMinutes, type NewsBlock } from "@/lib/news";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return news.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const n = getNews((await params).slug);
  return n ? { title: `${n.title} — ProStyle`, description: n.excerpt } : {};
}

function Block({ b, title }: { b: NewsBlock; title: string }) {
  switch (b.type) {
    case "h2":
      return <h2 className="mt-8 text-[22px] font-bold leading-tight md:text-[26px]">{b.text}</h2>;
    case "h3":
      return <h3 className="mt-6 text-[18px] font-semibold">{b.text}</h3>;
    case "p":
      return <p className="mt-4">{b.text}</p>;
    case "ul":
    case "ol": {
      const List = b.type;
      return (
        <List className={`mt-4 grid gap-2 pl-5 ${b.type === "ul" ? "list-disc" : "list-decimal"} marker:text-brand`}>
          {b.items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </List>
      );
    }
    case "img":
      return (
        <Image
          src={asset(b.src)}
          alt={title}
          width={b.w}
          height={b.h}
          sizes="(min-width:768px) 760px, 100vw"
          className="mt-6 h-auto w-full rounded-[14px] bg-surface"
        />
      );
  }
}

export default async function NewsArticlePage({ params }: { params: Promise<Params> }) {
  const n = getNews((await params).slug);
  if (!n) notFound();
  const others = news.filter((x) => x.slug !== n.slug).slice(0, 3);
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Новости", href: "/news" }, { label: n.title }]} />
      </Container>
      <article className="mx-auto w-full max-w-[808px] px-4 py-6 md:px-8 md:py-10">
        <p className="text-[13px] text-muted">
          <time dateTime={n.date}>{formatNewsDate(n.date)}</time> · {readingMinutes(n)} мин чтения
        </p>
        <h1 className="mt-2 text-[28px] font-bold leading-[1.15] tracking-tight md:text-[40px]">{n.title}</h1>
        <Image
          src={asset(n.cover)}
          alt=""
          width={900}
          height={560}
          priority
          sizes="(min-width:768px) 760px, 100vw"
          className="mt-6 aspect-[16/9] h-auto w-full rounded-[16px] bg-surface object-cover"
        />
        <div className="text-[16px] leading-[1.7] text-ink md:text-[17px]">
          {n.blocks.map((b, i) => (
            <Block key={i} b={b} title={n.title} />
          ))}
        </div>
        <div className="mt-10 rounded-[14px] bg-brand-soft p-5 md:p-6">
          <p className="text-[17px] font-semibold">Подберём подарки под вашу задачу</p>
          <p className="mt-1 text-[14px] text-muted">Расскажите о поводе, тираже и бюджете — менеджер предложит варианты и рассчитает нанесение.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/catalog" className="inline-flex h-11 items-center rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white hover:bg-brand-hover">Перейти в каталог</Link>
            <Link href="/brief" className="inline-flex h-11 items-center rounded-[10px] border border-brand bg-white px-5 text-[14px] font-semibold text-brand hover:bg-brand hover:text-white">Заполнить бриф</Link>
          </div>
        </div>
      </article>

      {others.length ? (
        <section aria-labelledby="more-news" className="border-t border-line">
          <Container className="py-8 md:py-10">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="more-news" className="text-[22px] font-bold md:text-[26px]">Ещё статьи</h2>
              <Link href="/news" className="text-[14px] font-semibold text-brand hover:text-brand-hover">Все новости</Link>
            </div>
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {others.map((x) => (
                <li key={x.slug}>
                  <Link href={`/news/${x.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-white">
                    <span className="relative aspect-[16/10] bg-surface">
                      <Image src={asset(x.cover)} alt="" fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover" />
                    </span>
                    <span className="p-4">
                      <span className="block text-[12px] text-muted">{formatNewsDate(x.date)}</span>
                      <span className="mt-1 block text-[15px] font-semibold leading-snug group-hover:text-brand">{x.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}
      <ConsultationCta />
    </main>
  );
}

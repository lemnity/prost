"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { asset } from "@/lib/asset";
import { TOPICS, formatNewsDate, type NewsCard, type Topic } from "@/lib/news-meta";

/** Список новостей с фильтром по темам. */
export function NewsList({ items }: { items: NewsCard[] }) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const list = topic ? items.filter((n) => n.topics.includes(topic)) : items;
  const [first, ...rest] = list;
  const topics = (Object.keys(TOPICS) as Topic[])
    .map((t) => ({ t, count: items.filter((n) => n.topics.includes(t)).length }))
    .filter((x) => x.count > 0);
  const chip = (on: boolean) =>
    `inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[14px] font-medium transition-colors ${
      on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-brand hover:text-brand"
    }`;

  return (
    <>
      <div role="group" aria-label="Темы" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <button type="button" aria-pressed={topic === null} onClick={() => setTopic(null)} className={chip(topic === null)}>
          Все темы <span className="tabular-nums opacity-60">{items.length}</span>
        </button>
        {topics.map(({ t, count }) => (
          <button key={t} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)} className={chip(topic === t)}>
            {TOPICS[t]} <span className="tabular-nums opacity-60">{count}</span>
          </button>
        ))}
      </div>
      <p role="status" className="sr-only">
        {topic ? `${TOPICS[topic]}: статей — ${list.length}` : ""}
      </p>

      {first ? (
        <article className="group relative mt-6 grid overflow-hidden rounded-[16px] border border-line bg-white md:grid-cols-2">
          <div className="relative aspect-[16/10] bg-surface md:aspect-auto md:min-h-[320px]">
            <Image src={asset(first.cover)} alt="" fill priority sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="flex flex-col p-5 md:p-8">
            <Meta n={first} />
            <h2 className="mt-2 text-[22px] font-bold leading-tight md:text-[28px]">
              <Link href={`/news/${first.slug}`} className="after:absolute after:inset-0 group-hover:text-brand">
                {first.title}
              </Link>
            </h2>
            <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-muted">{first.excerpt}</p>
            <span className="mt-auto pt-5 text-[14px] font-semibold text-brand">Читать статью →</span>
          </div>
        </article>
      ) : null}

      {rest.length ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((n) => (
            <li key={n.slug}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-white">
                <div className="relative aspect-[16/10] bg-surface">
                  <Image src={asset(n.cover)} alt="" fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <Meta n={n} small />
                  <h2 className="mt-1.5 text-[16px] font-semibold leading-snug">
                    <Link href={`/news/${n.slug}`} className="after:absolute after:inset-0 group-hover:text-brand">
                      {n.title}
                    </Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-snug text-muted">{n.excerpt}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function Meta({ n, small = false }: { n: NewsCard; small?: boolean }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-muted ${small ? "text-[12px]" : "text-[13px]"}`}>
      <time dateTime={n.date}>{formatNewsDate(n.date)}</time>
      {!small ? <span>· {n.minutes} мин чтения</span> : null}
      {n.topics.slice(0, 1).map((t) => (
        <span key={t} className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
          {TOPICS[t]}
        </span>
      ))}
    </p>
  );
}

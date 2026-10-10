import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getCatalogTree } from "@/lib/catalog";
import { applications } from "@/content/home";
import { legalLinks } from "@/lib/legal";
import news from "@/content/news.json";

export const metadata: Metadata = {
  title: "Карта сайта — ProStyle",
  description: "Все разделы сайта ProStyle: каталог корпоративных подарков и сувениров, виды нанесения, новости, доставка и документы.",
};

const PAGES = [
  { label: "Главная", href: "/" },
  { label: "Каталог", href: "/catalog" },
  { label: "Новинки", href: "/catalog/new" },
  { label: "Хиты", href: "/catalog/hits" },
  { label: "Распродажа", href: "/catalog/sale" },
  { label: "Распродажа недели", href: "/sale" },
  { label: "Новогодние подарки", href: "/catalog/novyy-god" },
  { label: "О компании", href: "/about" },
  { label: "Доставка и оплата", href: "/delivery" },
  { label: "Контакты", href: "/contact-us" },
  { label: "Бриф на разработку", href: "/brief" },
];

function Column({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <section>
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <ul className="mt-3 space-y-1.5 text-[14px]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ink/80 hover:text-brand">{l.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Карта сайта для посетителей; для поисковиков — /sitemap.xml. */
export default async function SitemapPage() {
  const tree = await getCatalogTree();
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Карта сайта" }]} />
        <h1 className="mt-4 text-[30px] font-bold leading-[1.12] tracking-tight md:text-[44px]">Карта сайта</h1>
      </Container>
      <Container className="grid gap-10 py-6 md:py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Column title="Основные страницы" links={PAGES} />
          <Column title="Виды нанесения" links={applications.items.map((a) => ({ label: a.title, href: a.href }))} />
          <Column title="Новости" links={[{ label: "Все новости", href: "/news" }, ...(news as { slug: string; title: string }[]).map((n) => ({ label: n.title, href: `/news/${n.slug}` }))]} />
          <Column title="Документы" links={legalLinks.filter((l) => l.href !== "/sitemap")} />
        </div>
        <section aria-labelledby="sitemap-catalog">
          <h2 id="sitemap-catalog" className="text-[22px] font-bold md:text-[26px]">Каталог</h2>
          <div className="mt-5 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {tree.map((c) => (
              <section key={c.id}>
                <h3 className="text-[15px] font-semibold">
                  <Link href={c.href} className="hover:text-brand">{c.title}</Link>
                </h3>
                {c.children.length ? (
                  <ul className="mt-2 space-y-1 text-[13px]">
                    {c.children.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} className="text-ink/75 hover:text-brand">{s.title}</Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}

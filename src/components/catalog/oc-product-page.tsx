import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductCard } from "./product-card";
import { ProductDetail, type VariantView } from "./product-detail";
import { ProductTabs } from "./product-tabs";
import { SimilarCarousel } from "./similar-carousel";
import { TelegramBox } from "./telegram-box";
import { applications } from "@/content/home";
import { catTrail } from "@/lib/catalog/oasis-tree";
import { sortRows } from "@/lib/catalog/stock";
import { attrsOf, colorOf, coverOf, modelRows, similarProducts, urlOf, type OcRow } from "@/server/catalog";

const snippet = (t: string, max = 160) => {
  const s = t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
};

export function ocProductMetadata(r: OcRow): Metadata {
  return {
    title: `${r.name} — ProStyle`,
    description: r.description ? snippet(r.description) : `${r.name}, артикул ${r.article}. Нанесение логотипа, доставка по России.`,
  };
}

/** Варианты модели: цвет = группа (group_id), размеры группы — строки остатков. */
function buildVariants(current: OcRow, rows: OcRow[]): { variants: VariantView[]; initial: number } {
  const groups = new Map<string, OcRow[]>();
  for (const r of rows) {
    const key = r.group_id ?? r.id;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  if (!groups.size) groups.set(current.group_id ?? current.id, [current]);
  const variants: VariantView[] = [...groups.entries()].map(([key, items]) => {
    const rep = items.find((i) => i.id === current.id) ?? items.find((i) => i.stock + i.remote > 0) ?? items[0];
    const sized = items.filter((i) => i.size);
    const info =
      sized.length > 1
        ? sortRows(sized.map((i) => ({ size: i.size!, stock: i.stock, free: i.stock, remote: i.remote })))
        : [{ size: "", stock: rep.stock, free: rep.stock, remote: rep.remote }];
    const old = rep.old_price ? Number(rep.old_price) : 0;
    return {
      key,
      label: colorOf(rep) || rep.size || rep.name,
      href: urlOf(rep),
      image: coverOf(rep),
      id: rep.id,
      url: urlOf(rep),
      title: rep.name,
      sku: rep.article,
      stock: items.reduce((s, i) => s + i.stock, 0),
      info,
      price: Number(rep.price),
      ...(old > Number(rep.price) ? { oldPrice: old } : {}),
    };
  });
  const initial = Math.max(0, variants.findIndex((v) => v.key === (current.group_id ?? current.id)));
  return { variants, initial };
}

export async function OcProductPage({ row }: { row: OcRow }) {
  const [rows, similar] = await Promise.all([modelRows(row), similarProducts(row)]);
  const { variants, initial } = buildVariants(row, rows);
  const paragraphs = (row.description ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const specs = [
    { label: "Артикул", value: row.article },
    ...(colorOf(row) ? [{ label: "Цвет", value: colorOf(row) }] : []),
    ...attrsOf(row)
      .filter((a) => a.value && !/^Цвет/.test(a.name))
      .map((a) => ({ label: a.name, value: `${a.value}${a.dim ? ` ${a.dim}` : ""}` })),
  ];
  const crumbs = [{ label: "Главная", href: "/" }, { label: "Каталог", href: "/catalog" }, ...(row.primary_cat ? catTrail(row.primary_cat) : []), { label: row.name }];

  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={crumbs} />
      </Container>
      <Container className="py-6 md:py-8">
        <ProductDetail key={row.id} title={row.name} brand="" variants={variants} initial={initial}>
          <section aria-labelledby="apps-title" className="mt-8 border-t border-line pt-6">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="apps-title" className="text-[17px] font-semibold">Виды нанесения</h2>
              <Link href={applications.link.href} className="text-[13px] font-medium text-brand hover:text-brand-hover">{applications.link.label}</Link>
            </div>
            <p className="text-[13px] text-muted">
              Подберём способ нанесения под материал и тираж — уточните у менеджера.{" "}
              <Link href="/contact-us#callback" className="font-medium text-brand hover:text-brand-hover">Рассчитать нанесение</Link>
            </p>
          </section>
        </ProductDetail>
      </Container>
      <Container className="pb-6 md:pb-8">
        <ProductTabs
          tabs={[
            {
              id: "description",
              label: "Описание",
              content: paragraphs.length ? (
                <div className="max-w-[820px] space-y-3 text-[15px] leading-relaxed text-ink/90">
                  {paragraphs.map((p, i) => (
                    <p key={i} className="whitespace-pre-line">{p}</p>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] text-muted">Описание уточняйте у менеджера.</p>
              ),
            },
            {
              id: "specs",
              label: "Характеристики",
              content: (
                <dl className="grid max-w-[980px] gap-x-10 text-[14px] md:grid-cols-2">
                  {specs.map((r, i) => (
                    <div key={`${r.label}-${i}`} className="grid grid-cols-[minmax(0,42%)_minmax(0,1fr)] gap-3 border-b border-line py-2.5">
                      <dt className="text-muted">{r.label}</dt>
                      <dd className="whitespace-pre-line break-words text-ink">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              ),
            },
          ]}
        />
      </Container>
      {similar.length ? (
        <section aria-labelledby="similar-title" className="bg-surface py-10">
          <Container className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
            <div className="flex flex-col">
              <h2 id="similar-title" className="mb-5 text-[22px] font-bold md:text-[26px] lg:mb-0">Похожие товары</h2>
              <TelegramBox className="mt-auto hidden lg:flex" />
            </div>
            <SimilarCarousel label="Похожие товары" items={similar.map((p) => ({ key: p.url, node: <ProductCard product={p} /> }))} />
            <TelegramBox className="mt-6 lg:hidden" />
          </Container>
        </section>
      ) : null}
    </main>
  );
}

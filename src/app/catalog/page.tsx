import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { asset } from "@/lib/asset";
import { productsLabel } from "@/lib/format";
import { getCatalogTree, getPopularCategories } from "@/lib/catalog";
import { countByCategory } from "@/lib/catalog/products";

export const metadata: Metadata = {
  title: "Каталог — ProStyle",
  description: "Каталог корпоративных подарков и сувениров с логотипом.",
};

const MAX_SUBS = 6;

export default async function CatalogPage() {
  const [tree, popular] = await Promise.all([getCatalogTree(), getPopularCategories()]);
  const images = new Map(popular.map((c) => [c.id, c.image]));
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Каталог" }]} />
        <h1 className="mt-4 text-[30px] font-bold leading-[1.12] tracking-tight md:text-[44px]">Каталог</h1>
      </Container>

      <Container className="py-6 md:py-8">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tree.map((cat) => {
            const image = images.get(cat.id);
            const subs = cat.children.slice(0, MAX_SUBS);
            const rest = cat.children.length - subs.length;
            const count = countByCategory(cat.id);
            return (
              <li key={cat.id} className="flex flex-col rounded-[10px] bg-surface p-4">
                <Link href={cat.href} className="group flex items-center gap-3">
                  {image ? (
                    <Image
                      src={asset(image)}
                      alt=""
                      width={72}
                      height={72}
                      sizes="72px"
                      className="size-[72px] shrink-0 object-contain motion-safe:transition-transform motion-safe:group-hover:scale-105"
                    />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold leading-snug text-ink group-hover:text-brand">
                      {cat.title}
                    </span>
                    <span className="mt-1 block text-[13px] text-muted">{productsLabel(count)}</span>
                  </span>
                </Link>
                <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-[13px]">
                  {subs.map((s) => (
                    <li key={s.href}>
                      <Link href={s.href} className="text-ink/80 hover:text-brand">
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                {rest > 0 ? (
                  <Link
                    href={cat.href}
                    className="mt-3 inline-flex items-center gap-1 self-start text-[13px] font-medium text-brand hover:text-brand-hover"
                  >
                    Ещё {rest}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Container>
      <ConsultationCta />
    </main>
  );
}

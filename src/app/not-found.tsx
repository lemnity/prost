import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { popularCategories } from "@/lib/catalog/static-data";

export const metadata: Metadata = {
  title: "Страница не найдена — ProStyle",
  // robots noindex Next.js добавляет на 404 сам; второй тег не нужен.
};

const POPULAR = ["promo-odezhda", "podarochnye-nabory", "ejednevniki", "posuda", "elektronika", "novyy-god"];

export default function NotFound() {
  const cats = POPULAR.map((id) => popularCategories.find((c) => c.id === id)).filter((c) => !!c);
  return (
    <main id="main">
      <Container className="flex flex-col items-center py-12 text-center md:py-20">
        <p aria-hidden="true" className="text-[96px] font-bold leading-none tracking-tight text-faint/50 md:text-[160px]">
          404
        </p>
        <h1 className="mt-4 text-[30px] font-bold leading-[1.12] tracking-tight md:text-[44px]">
          Страница не найдена
        </h1>
        <p className="mt-3 max-w-[460px] text-balance text-[15px] text-muted">
          Возможно, она ещё в разработке или адрес введён с ошибкой.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/catalog"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-brand px-8 text-[15px] font-semibold text-white hover:bg-brand-hover"
          >
            В каталог
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-brand bg-white px-8 text-[15px] font-semibold text-brand hover:bg-brand hover:text-white"
          >
            На главную
          </Link>
        </div>

        <nav aria-label="Популярные категории" className="mt-12 w-full max-w-[860px]">
          <p className="text-[13px] text-muted">Популярные категории</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {cats.map((c) => (
              <li key={c.id}>
                <Link
                  href={c.href}
                  className="inline-flex h-9 items-center rounded-full bg-surface px-4 text-[13px] text-ink hover:text-brand"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/contact-us"
          className="mt-8 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-hover"
        >
          Связаться с нами
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </Container>
    </main>
  );
}

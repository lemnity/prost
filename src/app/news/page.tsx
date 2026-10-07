import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { newsCards } from "@/lib/news";
import { NewsList } from "@/components/news/news-list";

export const metadata: Metadata = {
  title: "Новости и статьи — ProStyle",
  description: "Новости ProStyle и статьи о корпоративных подарках, сувенирной продукции и нанесении логотипа.",
};

export default function NewsPage() {
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Новости" }]} />
        <h1 className="mt-6 text-[30px] font-bold leading-[1.12] tracking-tight md:mt-8 md:text-[44px]">Новости и статьи</h1>
        <p className="mt-3 max-w-[640px] text-[15px] text-muted md:text-[16px]">
          Рассказываем о корпоративных подарках, видах нанесения и о том, как сувениры работают на ваш бренд.
        </p>
      </Container>

      <Container className="py-8 md:py-10">
        <NewsList items={newsCards} />
      </Container>
      <ConsultationCta />
    </main>
  );
}

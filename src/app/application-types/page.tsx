import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ConsultationCta } from "@/components/home/consultation-cta";
import { ApplicationCard } from "@/components/application-types/application-card";
import { Blocks } from "@/components/application-types/blocks";
import { applications } from "@/content/home";
import { overview } from "@/lib/application-types";

const INTRO =
  "Выберите способ нанесения логотипа: у каждого свои возможности по материалам, тиражу, срокам и стоимости. Подробности, прайс-листы и требования к макетам — на странице каждого вида.";

export const metadata: Metadata = {
  title: "Виды нанесения логотипа | ProStyle",
  description: INTRO,
};

export default function ApplicationTypesPage() {
  return (
    <main id="main">
      <Container className="pt-4 md:pt-6">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Виды нанесения" }]} />
      </Container>

      <section aria-labelledby="apt-title" className="py-6 md:py-8">
        <Container>
          <h1 id="apt-title" className="text-[30px] font-bold leading-[1.12] tracking-tight md:text-[40px]">
            {overview.title}
          </h1>
          <p className="mt-3 max-w-[70ch] text-[16px] leading-relaxed text-muted">{INTRO}</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {applications.items.map((a) => (
              <li key={a.id} className="min-w-0">
                <ApplicationCard item={a} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {overview.sections.map((s) => (
        <section key={s.heading} aria-labelledby="apt-about" className="pb-6 md:pb-8">
          <Container>
            <h2 id="apt-about" className="text-[22px] font-bold md:text-[26px]">
              {s.heading}
            </h2>
            <Blocks blocks={s.blocks} />
          </Container>
        </section>
      ))}

      <ConsultationCta />
    </main>
  );
}

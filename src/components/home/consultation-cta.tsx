import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export function ConsultationCta() {
  return (
    <section aria-labelledby="cta-title" className="relative mt-4 overflow-hidden bg-cta">
      <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[34%] lg:block">
        <Image
          src="/images/hero/cta.webp"
          alt=""
          fill
          sizes="34vw"
          className="object-cover object-left"
        />
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-cta to-transparent" />
      </div>
      <Container className="relative z-10 flex flex-col items-stretch gap-5 py-8 sm:items-start lg:h-[150px] lg:flex-row lg:items-center lg:py-0">
        <div className="lg:w-[45%]">
          <h2 id="cta-title" className="text-[22px] font-bold leading-tight">
            Не знаете, что выбрать?
            <span className="block text-brand">Получите бесплатную консультацию</span>
          </h2>
          <p className="mt-2 text-sm text-muted">
            Наши специалисты помогут подобрать решения под ваши задачи и бюджет.
          </p>
        </div>
        <Link
          href="/contact-us#callback"
          className="inline-flex h-[52px] items-center justify-center rounded-lg bg-brand px-10 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Получить консультацию
        </Link>
      </Container>
    </section>
  );
}

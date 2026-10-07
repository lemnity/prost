import Link from "next/link";
import { Container } from "@/components/ui/container";

export function ConsultationCta() {
  return (
    <section aria-labelledby="cta-title" className="bg-cta-gradient relative mt-6 overflow-hidden text-white">
      {/* Мягкие световые пятна поверх градиента. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 right-[15%] size-80 rounded-full bg-[#ffb199]/20 blur-3xl" />
      </div>
      <Container className="relative z-10 flex flex-col items-stretch gap-5 py-8 sm:items-start lg:h-[150px] lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <div className="lg:max-w-[60%]">
          <h2 id="cta-title" className="text-[22px] font-bold leading-tight">
            Не знаете, что выбрать?
            <span className="block text-white/90">Получите бесплатную консультацию</span>
          </h2>
          <p className="mt-2 text-sm text-balance text-white/80">
            Наши специалисты помогут подобрать решения под ваши задачи и бюджет.
          </p>
        </div>
        <Link
          href="/contact-us#callback"
          className="inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] border border-white bg-white px-10 text-[15px] font-semibold text-brand shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-colors hover:bg-white/90 focus-visible:outline-white"
        >
          Получить консультацию
        </Link>
      </Container>
    </section>
  );
}

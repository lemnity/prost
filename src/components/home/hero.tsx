import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem, Package, PenTool } from "lucide-react";
import { Container } from "@/components/ui/container";
import { hero } from "@/content/home";

const icons = { gem: Gem, package: Package, pen: PenTool } as const;

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-gradient-to-b from-white to-hero lg:h-[460px]"
    >
      <Container className="relative z-10 flex flex-col justify-center py-8 lg:h-full lg:py-0">
        <div className="max-w-[560px]">
          <h1
            id="hero-title"
            className="text-[30px] font-bold leading-[1.12] tracking-tight sm:text-4xl lg:whitespace-nowrap lg:text-[clamp(36px,1.5625vw+20px,44px)]"
          >
            {hero.title.line1}
            <br />
            {hero.title.line2} <span className="text-brand">{hero.title.accent}</span>
          </h1>
          <p className="mt-4 max-w-[480px] text-[15px] text-muted">{hero.text}</p>
          <ul className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            {hero.stats.map((s) => {
              const Icon = icons[s.icon];
              return (
                <li
                  key={s.bold}
                  className="flex items-center gap-3 rounded-[10px] border border-line bg-white px-4 py-3"
                >
                  <Icon size={22} strokeWidth={1.5} className="shrink-0 text-brand" aria-hidden="true" />
                  <span className="flex flex-col">
                    <span className="text-[13px] font-bold leading-tight">{s.bold}</span>
                    <span className="text-[11px] leading-tight text-muted">{s.caption}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={hero.primaryCta.href}
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-lg bg-brand px-10 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              {hero.primaryCta.label}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href={hero.secondaryCta.href}
              className="inline-flex h-[52px] items-center justify-center rounded-lg border border-line bg-white px-8 text-sm font-semibold hover:bg-surface"
            >
              {hero.secondaryCta.label}
            </Link>
          </div>
        </div>
      </Container>
      <div className="relative aspect-[1398/855] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:h-full lg:w-[46%] xl:w-[58%]">
        <Image
          src={hero.image}
          alt=""
          fill
          preload
          sizes="(min-width:1280px) 58vw, (min-width:1024px) 46vw, 100vw"
          className="object-cover lg:object-right"
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-b from-white to-hero lg:block"
          style={{
            maskImage: "linear-gradient(to right, #000, transparent)",
            WebkitMaskImage: "linear-gradient(to right, #000, transparent)",
          }}
        />
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { CarouselDots } from "@/components/ui/carousel-dots";
import { applications } from "@/content/home";

const TRACK_ID = "application-types-track";

export function ApplicationTypes() {
  return (
    <section aria-labelledby="application-types-title" className="py-5 md:py-6">
      <Container>
        <SectionHeader
          id="application-types-title"
          title={applications.title}
          link={applications.link}
        />
        <div
          id={TRACK_ID}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 motion-safe:scroll-smooth"
        >
          {applications.items.map((a) => (
            <Link
              key={a.id}
              href={a.href}
              className="group relative block h-[170px] shrink-0 basis-[82%] snap-start overflow-hidden rounded-[10px] bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-offset-[-2px] md:h-[190px] md:basis-[calc((100%-16px)/2)] lg:basis-[calc((100%-32px)/3)] xl:basis-[calc((100%-48px)/4)]"
            >
              <Image
                src={a.image}
                alt=""
                width={640}
                height={640}
                sizes="(min-width:1280px) 12vw, (min-width:1024px) 18vw, (min-width:768px) 25vw, 40vw"
                className="absolute inset-y-3 right-3 h-[calc(100%-1.5rem)] w-[48%] object-contain transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
              />
              <h3 className="relative z-10 max-w-[62%] p-5 pr-0 text-[22px] font-semibold leading-tight xl:text-xl text-ink">
                {a.title}
              </h3>
              <span className="absolute bottom-5 left-5 inline-flex h-10 items-center rounded-[8px] bg-brand px-5 text-[15px] font-semibold text-white group-hover:bg-brand-hover">
                Подробнее
              </span>
            </Link>
          ))}
        </div>
        <CarouselDots trackId={TRACK_ID} count={applications.items.length} />
      </Container>
    </section>
  );
}

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
              className="group @container relative block h-[200px] shrink-0 basis-[85%] snap-start overflow-hidden rounded-[10px] bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_20px_rgba(0,0,0,0.09)] focus-visible:outline-offset-[-2px] md:h-[220px] md:basis-[calc((100%-16px)/2)] md:p-6 lg:basis-[calc((100%-32px)/3)] xl:h-[230px] xl:basis-[calc((100%-48px)/4)]"
            >
              <Image
                src={a.image}
                alt=""
                width={640}
                height={640}
                sizes="(min-width:1280px) 12vw, (min-width:1024px) 18vw, (min-width:768px) 25vw, 45vw"
                className="absolute bottom-2 right-2 top-[76px] h-[calc(100%-84px)] w-[55%] object-contain object-right-bottom drop-shadow-[0_8px_12px_rgba(0,0,0,0.12)] motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.04]"
              />
              <h3 className="relative z-10 line-clamp-2 text-[20px] font-semibold leading-tight text-balance text-ink @[320px]:text-[22px]">
                {a.title}
              </h3>
              <span className="absolute bottom-5 left-5 inline-flex h-10 items-center rounded-[8px] bg-brand px-5 text-[14px] font-semibold text-white group-hover:bg-brand-hover md:bottom-6 md:left-6">
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

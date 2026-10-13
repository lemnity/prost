import { asset } from "@/lib/asset";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getBanners } from "@/server/site";
import { BannerSliderControls } from "./banner-slider-controls";

export async function BannerSlider() {
  const banners = await getBanners();
  const total = banners.length;
  if (!total) return null;
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Акции и подборки"
      className="pt-0"
    >
      <Container>
        <div
          data-banner-slider
          className="group/slider relative isolate aspect-[2400/644] transform-gpu overflow-hidden rounded-[10px] bg-surface"
        >
          <div
            data-banner-track
            className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto motion-safe:scroll-smooth"
          >
            {banners.map((b, i) => {
              const img = (
                <Image
                  src={asset(b.image)}
                  alt={b.alt}
                  fill
                  sizes="100vw"
                  preload={i === 0}
                  className="object-cover"
                />
              );
              return (
                <div
                  key={b.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} из ${total}`}
                  className="relative h-full w-full min-w-full shrink-0 basis-full snap-start snap-always"
                >
                  {b.href ? (
                    <Link href={b.href} className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand">
                      {img}
                    </Link>
                  ) : (
                    img
                  )}
                </div>
              );
            })}
          </div>
          <BannerSliderControls count={total} />
        </div>
      </Container>
    </section>
  );
}

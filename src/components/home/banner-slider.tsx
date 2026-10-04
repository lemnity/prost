import { asset } from "@/lib/asset";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { banners } from "@/content/home";
import { BannerSliderControls } from "./banner-slider-controls";

export function BannerSlider() {
  const total = banners.length;
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
            {banners.map((b, i) => (
              <div
                key={b.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} из ${total}`}
                className="relative h-full w-full min-w-full shrink-0 basis-full snap-start snap-always"
              >
                <Image
                  src={asset(b.image)}
                  alt={b.alt}
                  fill
                  sizes="100vw"
                  preload={i === 0}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <BannerSliderControls count={total} />
        </div>
      </Container>
    </section>
  );
}

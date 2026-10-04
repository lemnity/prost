import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { works } from "@/content/home";

export function OurWorks() {
  return (
    <section aria-labelledby="our-works-title" className="py-5 md:py-6">
      <Container>
        <SectionHeader id="our-works-title" title={works.title} link={works.link} />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {works.items.map((w) => (
            <li key={w.id}>
              <Link
                href={w.href}
                className="relative flex h-[130px] items-start overflow-hidden rounded-[10px] bg-work focus-visible:outline-offset-[-2px]"
              >
                <div className="absolute inset-y-0 right-0 w-[60%]">
                  <Image
                    src={w.image}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 15vw, (min-width: 1024px) 14vw, (min-width: 640px) 30vw, 55vw"
                    className="object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-work via-work/80 to-transparent"
                  />
                </div>
                <div className="relative z-10 max-w-[60%] p-5">
                  <p className="text-[13px] font-bold text-balance text-case">{w.client}</p>
                  <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{w.text}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

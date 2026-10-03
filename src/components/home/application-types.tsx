import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { applications } from "@/content/home";

export function ApplicationTypes() {
  return (
    <section aria-labelledby="application-types-title" className="py-5 md:py-6">
      <Container>
        <SectionHeader
          id="application-types-title"
          title={applications.title}
          link={applications.link}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {applications.items.map((a) => (
            <Link key={a.id} href={a.href} className="block overflow-hidden rounded-[10px] bg-surface focus-visible:outline-offset-[-2px]">
              <div className="relative aspect-[360/189]">
                <Image
                  src={a.image}
                  alt=""
                  fill
                  sizes="(min-width:1024px) 200px, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-balance">{a.title}</h3>
                <p className="mt-1.5 line-clamp-3 text-[12.5px] text-muted">{a.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

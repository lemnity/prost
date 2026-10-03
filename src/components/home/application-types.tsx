import Image from "next/image";
import Link from "next/link";
import { Clock, Layers } from "lucide-react";
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          {applications.items.map((a) => (
            <Link
              key={a.id}
              href={a.href}
              className="flex flex-col overflow-hidden rounded-[10px] bg-surface focus-visible:outline-offset-[-2px]"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={a.image}
                  alt=""
                  fill
                  sizes="(min-width:1280px) 16vw, (min-width:768px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h3 className="text-sm font-bold text-balance">{a.title}</h3>
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted">
                  <Clock aria-hidden size={13} className="mt-px shrink-0" />
                  <span>{a.term}</span>
                </p>
                <p className="mt-1 flex items-start gap-1.5 text-xs text-muted">
                  <Layers aria-hidden size={13} className="mt-px shrink-0" />
                  <span>{a.run}</span>
                </p>
                <p className="mt-2 hidden line-clamp-3 text-[12.5px] text-muted md:block">{a.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

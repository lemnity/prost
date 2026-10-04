import { asset } from "@/lib/asset";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { clients } from "@/content/home";

// Natural widths of the logo PNGs (height is 84 for all).
const logoWidth: Record<string, number> = {
  sibur: 132,
  lukoil: 156,
  rosneft: 165,
  gazprom: 144,
  rzd: 105,
  sber: 120,
  yandex: 135,
  tyumen: 210,
};

export function Clients() {
  return (
    <section aria-labelledby="clients-title" className="py-5 md:py-6">
      <Container className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
        <h2 id="clients-title" className="shrink-0 text-sm font-bold">
          {clients.title}
        </h2>
        <p className="shrink-0 text-[13px] text-muted xl:order-last">{clients.note}</p>
        <ul className="no-scrollbar xl:order-none -mx-4 flex items-center gap-6 overflow-x-auto px-4 md:-mx-8 md:px-8 xl:mx-0 xl:min-w-0 xl:flex-1 xl:justify-around xl:gap-4 xl:overflow-visible xl:px-0">
          {clients.items.map((c) => (
            <li key={c.id} className="shrink-0">
              <Image
                src={asset(c.logo)}
                alt={c.name}
                width={logoWidth[c.id] ?? 132}
                height={84}
                sizes="(min-width: 1280px) 10vw, (min-width: 1024px) 130px, 100px"
                className="h-[38px] w-auto mix-blend-multiply grayscale contrast-125"
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

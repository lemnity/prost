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
    <section aria-labelledby="clients-title" className="py-8">
      <Container className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <h2 id="clients-title" className="order-[-2] shrink-0 text-sm lg:order-none font-bold">
          {clients.title}
        </h2>
        <ul className="no-scrollbar -mx-4 flex items-center gap-6 overflow-x-auto px-4 md:-mx-8 md:px-8 lg:mx-0 lg:min-w-0 lg:flex-1 lg:justify-around lg:gap-4 lg:overflow-visible lg:px-0">
          {clients.items.map((c) => (
            <li key={c.id} className="shrink-0">
              <Image
                src={c.logo}
                alt={c.name}
                width={logoWidth[c.id] ?? 132}
                height={84}
                sizes="95px"
                className="h-[38px] w-auto grayscale opacity-80"
              />
            </li>
          ))}
        </ul>
        <p className="order-[-1] shrink-0 text-[13px] text-muted lg:order-none">{clients.note}</p>
      </Container>
    </section>
  );
}

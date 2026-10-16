import { asset } from "@/lib/asset";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { brands } from "@/content/home";

// Логотипы разной формы выравниваем по площади, а не по высоте: иначе длинные (Waterline)
// выглядят крупнее квадратных (Rivacase). Ширина = √(площадь × соотношение сторон), но не шире ячейки.
const AREA = 3200;
const logoWidth = (w: number, h: number) => Math.round(Math.sqrt(AREA * (w / h)));

export function Brands() {
  return (
    <section aria-labelledby="brands-title" className="py-5 md:py-6">
      <Container>
        <SectionHeader id="brands-title" title={brands.title} note={brands.note} />
        <ul className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
          {brands.items.map((b) => (
            <li
              key={b.id}
              className="flex h-[68px] items-center justify-center rounded-[10px] border border-line bg-white px-2 sm:h-[88px] sm:px-4 lg:h-[104px]"
            >
              <Image
                src={asset(b.logo)}
                alt={b.name}
                width={b.width}
                height={b.height}
                sizes="(min-width: 768px) 160px, 30vw"
                style={{ width: logoWidth(b.width, b.height) }}
                className="h-auto max-w-[85%]"
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

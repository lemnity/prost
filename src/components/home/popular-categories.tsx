import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { getPopularCategories } from "@/lib/catalog";

type Cat = Awaited<ReturnType<typeof getPopularCategories>>[number];

function Tile({ cat, small }: { cat: Cat; small?: boolean }) {
  return (
    <Link
      href={cat.href}
      className={`group relative block h-[150px] overflow-hidden rounded-[10px] bg-surface focus-visible:outline-offset-[-2px] ${
        small ? "lg:h-[158px]" : "lg:h-[182px]"
      }`}
    >
      <div className="absolute inset-x-1 top-1 bottom-[22%]">
        <Image
          src={cat.image}
          alt=""
          fill
          sizes="(min-width:1024px) 200px, 45vw"
          className="object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
      <span
        className={`absolute inset-x-0 bottom-0 line-clamp-2 text-balance p-3.5 font-semibold leading-tight ${
          small ? "text-[13px] lg:text-xs" : "text-[13px]"
        }`}
      >
        {cat.title}
      </span>
    </Link>
  );
}

export async function PopularCategories() {
  const cats = await getPopularCategories();
  const first = cats.slice(0, 12);
  const rest = cats.slice(12);
  return (
    <section aria-labelledby="popular-categories-title" className="py-5 md:py-6">
      <Container>
        <SectionHeader
          id="popular-categories-title"
          title="Популярные категории"
          link={{ label: "Смотреть все категории", href: "/catalog" }}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {first.map((c) => (
            <Tile key={c.id} cat={c} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {rest.map((c) => (
            <Tile key={c.id} cat={c} small />
          ))}
        </div>
      </Container>
    </section>
  );
}

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { getPopularCategories } from "@/lib/catalog";
import { getNewYearCountdown, getUpcomingHolidays } from "@/lib/holidays";
import { HolidayStatus } from "./holiday-status";
import { NewYearCountdown } from "./new-year-countdown";

type Cat = Awaited<ReturnType<typeof getPopularCategories>>[number];

// Значения на момент сборки; клиентские островки обновят их после монтирования.
const buildNow = new Date();
const initialCountdown = getNewYearCountdown(buildNow);
const initialHolidays = getUpcomingHolidays(buildNow, 2);

function WideTile({ cat, className = "" }: { cat: Cat; className?: string }) {
  return (
    <Link
      href={cat.href}
      style={{
        backgroundImage:
          "radial-gradient(circle at 76% 55%, var(--color-glow), transparent 60%)",
      }}
      className={`group relative block h-[150px] overflow-hidden rounded-[10px] bg-surface focus-visible:outline-offset-[-2px] lg:h-[182px] ${className}`}
    >
      <div
        className="absolute -bottom-[6%] right-0 top-0 w-[40%] xl:w-[45%]"
        style={{
          WebkitMaskImage:
            "radial-gradient(closest-side, #000 72%, transparent)",
          maskImage: "radial-gradient(closest-side, #000 72%, transparent)",
        }}
      >
        <Image
          src={cat.image}
          alt=""
          fill
          sizes="(min-width:1280px) 20vw, (min-width:768px) 30vw, 40vw"
          className="object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
      <div className="relative flex h-full w-[60%] flex-col justify-between p-3 xl:p-4">
        <div>
          <span className="block whitespace-nowrap text-base font-semibold leading-tight xl:text-xl">
            {cat.title}
          </span>
          <div className="mt-1 xl:mt-1.5">
            <NewYearCountdown initial={initialCountdown} />
          </div>
        </div>
        <span className="flex items-center gap-1 text-[13px] font-semibold leading-none text-brand">
          Выбрать подарки <ArrowRight size={14} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function Tile({
  cat,
  small,
  className = "",
}: {
  cat: Cat;
  small?: boolean;
  className?: string;
}) {
  const hasBadge = cat.id === "suveniry-k-prazdnikam";
  return (
    <Link
      href={cat.href}
      className={`group @container relative block h-[150px] overflow-hidden rounded-[10px] bg-surface focus-visible:outline-offset-[-2px] ${
        small ? "lg:h-[182px] xl:h-[158px]" : "lg:h-[182px]"
      } ${className}`}
    >
      <div
        className={`absolute inset-x-3 ${hasBadge ? "top-[34px]" : "top-3"} ${
          small ? "bottom-[52px] xl:bottom-[46px]" : "bottom-[52px]"
        }`}
      >
        <Image
          src={cat.image}
          alt=""
          fill
          sizes="(min-width:1280px) 16vw, (min-width:1024px) 200px, 45vw"
          className="object-contain mix-blend-multiply brightness-[1.07] transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
      {hasBadge && (
        <HolidayStatus initial={initialHolidays} />
      )}
      <span
        className={`absolute inset-x-0 bottom-0 line-clamp-2 box-border px-3.5 pt-1 text-balance font-semibold leading-tight ${
          small
            ? "h-[52px] text-[13px] xl:h-[46px] xl:text-xs"
            : "h-[52px] text-[13px]"
        }`}
      >
        {cat.title}
      </span>
    </Link>
  );
}

export async function PopularCategories() {
  const cats = await getPopularCategories();
  const first = cats.slice(0, 11);
  const rest = cats.slice(11);
  return (
    <section aria-labelledby="popular-categories-title" className="py-5 md:py-6">
      <Container>
        <SectionHeader
          id="popular-categories-title"
          title="Популярные категории"
          link={{ label: "Смотреть все категории", href: "/catalog" }}
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:block">
          <div className="contents xl:grid xl:grid-cols-6 xl:gap-3">
            {first.map((c) =>
              c.id === "novyy-god" ? (
                <WideTile key={c.id} cat={c} className="col-span-2" />
              ) : (
                <Tile key={c.id} cat={c} />
              ),
            )}
          </div>
          <div className="contents xl:mt-3 xl:grid xl:grid-cols-9 xl:gap-3">
            {rest.map((c, i) => (
              <Tile
                key={c.id}
                cat={c}
                small
                className={
                  i === rest.length - 1 ? "col-span-2 md:col-span-1" : ""
                }
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

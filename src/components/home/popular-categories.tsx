import { asset } from "@/lib/asset";
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

const FLAKES = Array.from({ length: 20 }, (_, i) => ({
  left: (i * 37 + 11) % 97,
  size: 3 + ((i * 3) % 5),
  dur: 6 + ((i * 7) % 9),
  delay: -((i * 3) % 11),
  drift: ((i % 2 ? 1 : -1) * (6 + ((i * 4) % 12))),
}));

function WideTile({ cat, className = "" }: { cat: Cat; className?: string }) {
  return (
    <Link
      href={cat.href}
      style={{
        backgroundImage:
          "radial-gradient(circle at 0% 0%, #fff 0, transparent 35%), radial-gradient(circle at 100% 0%, #fff 0, transparent 30%), linear-gradient(160deg, var(--color-snow-1), var(--color-snow-2) 55%, var(--color-snow-3))",
      }}
      className={`group relative block h-[150px] overflow-hidden rounded-[10px] bg-snow-2 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_24px_rgba(16,24,40,0.08)] ring-1 ring-[#DCEAF5] transition-shadow duration-200 hover:shadow-[0_2px_4px_rgba(16,24,40,0.08),0_12px_32px_rgba(16,24,40,0.12)] focus-visible:outline-offset-[-2px] lg:h-[182px] ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-3 -left-[5%] h-10 w-[110%] rounded-[50%] bg-white"
        style={{ boxShadow: "0 -2px 8px rgba(191,217,238,.6)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-5 left-[30%] h-9 w-[80%] rounded-[50%] bg-white"
      />
      <div
        className="ny-globe absolute -bottom-[6%] right-0 top-0 w-[36%] xl:w-[38%]"
        style={{
          WebkitMaskImage:
            "radial-gradient(closest-side, #000 72%, transparent)",
          maskImage: "radial-gradient(closest-side, #000 72%, transparent)",
        }}
      >
        <Image
          src={asset(cat.image)}
          alt=""
          fill
          sizes="(min-width:1280px) 20vw, (min-width:768px) 30vw, 40vw"
          className="object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      >
        {FLAKES.map((f, i) => (
          <span
            key={i}
            className="ny-flake absolute -top-2 rounded-full bg-white opacity-0"
            style={
              {
                left: `${f.left}%`,
                width: f.size,
                height: f.size,
                boxShadow: "0 0 0 1px #A9CBE6, 0 1px 4px rgba(90,140,190,.55)",
                "--dur": `${f.dur}s`,
                "--delay": `${f.delay}s`,
                "--drift": `${f.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="relative flex h-full w-full flex-col justify-between p-3 xl:p-4">
        <div>
          <span className="block whitespace-nowrap text-base font-semibold leading-tight xl:text-xl">
            {cat.title}
          </span>
          <div className="mt-1 xl:mt-1.5">
            <NewYearCountdown initial={initialCountdown} />
          </div>
        </div>
        <span className="flex items-center gap-1 self-start text-[13px] font-semibold leading-none text-brand">
          Выбрать подарки{" "}
          <ArrowRight size={14} aria-hidden="true" className="ny-arrow" />
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
        className={`absolute inset-x-3 ${hasBadge ? "top-[44px]" : "top-3"} ${
          small ? "bottom-[58px] xl:bottom-[52px]" : "bottom-[58px]"
        }`}
      >
        <Image
          src={asset(cat.image)}
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

import { asset } from "@/lib/asset";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { getNewYearPicks, getPopularCategories } from "@/lib/catalog";
import type { Product } from "@/lib/catalog";
import { formatPriceValue } from "@/lib/format";
import { getNewYearCountdown, getUpcomingHolidays } from "@/lib/holidays";
import { HolidayStatus } from "./holiday-status";
import { NewYearCountdown } from "./new-year-countdown";

type Cat = Awaited<ReturnType<typeof getPopularCategories>>[number];

// Значения на момент сборки; клиентские островки обновят их после монтирования.
const buildNow = new Date();
const initialCountdown = getNewYearCountdown(buildNow);
const initialHolidays = getUpcomingHolidays(buildNow, 2);

const FLAKES = Array.from({ length: 10 }, (_, i) => ({
  left: (i * 37 + 11) % 61,
  size: 2 + ((i * 3) % 3),
  dur: 6 + ((i * 7) % 9),
  delay: -((i * 3) % 11),
  drift: ((i % 2 ? 1 : -1) * (6 + ((i * 4) % 12))),
}));

function WideTile({
  cat,
  picks,
  className = "",
}: {
  cat: Cat;
  picks: Product[];
  className?: string;
}) {
  return (
    <Link
      href={cat.href}
      style={{
        backgroundImage:
          "radial-gradient(circle at 0% 0%, #fff 0, transparent 35%), radial-gradient(circle at 100% 0%, #fff 0, transparent 30%), linear-gradient(160deg, var(--color-snow-1), var(--color-snow-2) 55%, var(--color-snow-3))",
      }}
      className={`relative block h-[150px] overflow-hidden rounded-[10px] bg-snow-2 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_24px_rgba(16,24,40,0.08)] ring-1 ring-[#B9D6EE] transition-shadow hover:ring-[#9CC5E8] duration-200 hover:shadow-[0_2px_4px_rgba(16,24,40,0.08),0_12px_32px_rgba(16,24,40,0.12)] focus-visible:outline-offset-[-2px] lg:h-[182px] ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
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
      <div
        aria-hidden="true"
        className="absolute bottom-3 right-3 top-3 z-10 flex w-[30%] flex-col overflow-hidden min-[360px]:w-[32%] rounded-[14px] bg-white ring-1 ring-[#DCEAF5] shadow-[0_1px_2px_rgba(16,24,40,.05),0_6px_16px_rgba(16,24,40,.08)] sm:w-[34%] xl:w-[32%]"
      >
        <ul className="relative m-0 min-h-0 flex-1 list-none p-0">
          {picks.map((p, i) => (
            <li
              key={p.id}
              style={{ "--i": i } as React.CSSProperties}
              className={`ny-slide absolute inset-0 flex flex-col px-2 pt-2 sm:px-3 sm:pt-3 ${
                i === 0 ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="relative min-h-0 w-full flex-1">
                <Image
                  src={asset(p.image)}
                  alt=""
                  fill
                  sizes="(min-width:1280px) 120px, (min-width:640px) 15vw, 30vw"
                  loading={i === 0 ? "eager" : "lazy"}
                  className="object-contain"
                />
              </div>
              <span className="mt-1.5 line-clamp-2 text-[11px] leading-tight text-ink md:text-[12px]">
                {p.title}
              </span>
              <span className="block text-[13px] font-bold leading-tight text-brand">
                от {formatPriceValue(p.priceFrom)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex h-[5px] shrink-0 items-center justify-center gap-1 mb-2 mt-1.5 sm:mb-3">
          {picks.map((p, i) => (
            <span
              key={p.id}
              style={{ "--i": i } as React.CSSProperties}
              className={`ny-dot h-[5px] rounded-full ${
                i === 0 ? "w-[14px] bg-brand" : "w-[5px] bg-[#C9DCEB]"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="relative z-10 flex h-full w-[62%] min-w-0 flex-col justify-between p-3">
        <div>
          <span className="block whitespace-nowrap text-[15px] font-semibold min-[360px]:text-base leading-tight xl:text-xl">
            {cat.title}
          </span>
          <div className="mt-1.5 xl:mt-2">
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
  const [cats, picks] = await Promise.all([
    getPopularCategories(),
    // Keyframes ny-slide рассчитаны ровно на 7 слайдов — не менять лимит.
    getNewYearPicks(7),
  ]);
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
                <WideTile key={c.id} cat={c} picks={picks} className="col-span-2" />
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

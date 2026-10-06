import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import type { Application } from "@/content/home";

export function ApplicationCard({ item: a }: { item: Application }) {
  return (
    <Link
      href={a.href}
      className="group @container relative flex h-[240px] flex-col overflow-hidden rounded-[10px] bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_20px_rgba(0,0,0,0.09)] focus-visible:outline-offset-[-2px] md:p-6"
    >
      <Image
        src={asset(a.image)}
        alt=""
        width={640}
        height={640}
        sizes="(min-width:1280px) 12vw, (min-width:1024px) 18vw, (min-width:768px) 25vw, 45vw"
        className="absolute bottom-2 right-2 top-[76px] h-[calc(100%-120px)] w-[50%] object-contain object-right-bottom drop-shadow-[0_8px_12px_rgba(0,0,0,0.12)] motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.04]"
      />
      <h2 className="relative z-10 line-clamp-2 text-[20px] font-semibold leading-tight text-balance text-ink @[320px]:text-[22px]">
        {a.title}
      </h2>
      <p className="relative z-10 mt-2 text-[12px] leading-snug text-muted">
        {a.term}
        <br />
        {a.run}
      </p>
      <span className="absolute bottom-5 left-5 inline-flex h-10 items-center rounded-[8px] bg-brand px-5 text-[14px] font-semibold text-white group-hover:bg-brand-hover md:bottom-6 md:left-6">
        Подробнее
      </span>
    </Link>
  );
}

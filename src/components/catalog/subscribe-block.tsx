/* eslint-disable @next/next/no-img-element -- small static SVG logos */
import type { CSSProperties } from "react";
import { site, type SocialKey } from "@/content/site";
import { asset } from "@/lib/asset";

const ORDER: SocialKey[] = ["vk", "telegram", "max"];
const COLORS: Record<SocialKey, string> = { vk: "#2787F5", telegram: "#419FD9", max: "#6C4DF6" };

/** Подписка на каналы компании (пустое состояние каталога). */
export function SubscribeBlock() {
  const socials = ORDER.map((k) => site.socials.find((s) => s.key === k)).filter((s) => !!s);
  return (
    <div className="mt-6 border-t border-line pt-6">
      <p className="text-[15px] font-semibold text-ink">Подпишитесь на наш канал — и вы узнаете первыми!</p>
      <ul className="mx-auto mt-4 flex max-w-[620px] flex-col gap-3 sm:flex-row sm:justify-center">
        {socials.map((s) => {
          const cls =
            "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-(--c) bg-white px-5 text-sm font-semibold text-(--c) motion-safe:transition-colors hover:bg-(--c)/10 focus-visible:outline-(--c)";
          const body = (
            <>
              <img
                src={asset(`/images/social/${s.key}.svg`)}
                alt=""
                width={20}
                height={20}
                className={`size-5 shrink-0 rounded-full object-cover ${s.key === "max" ? "scale-125" : ""}`}
              />
              {s.label}
            </>
          );
          const style = { "--c": COLORS[s.key] } as CSSProperties;
          return (
            <li key={s.key} className="sm:flex-1">
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={style} className={cls}>
                  {body}
                </a>
              ) : (
                <span style={style} className={`${cls} opacity-60`}>
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

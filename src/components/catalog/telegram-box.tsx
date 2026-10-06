import { asset } from "@/lib/asset";
import { site } from "@/content/site";

/** Подписка на Telegram-канал (блок рядом с «Похожими товарами»). */
export function TelegramBox({ className = "" }: { className?: string }) {
  const tg = site.socials.find((s) => s.key === "telegram");
  return (
    <div className={`flex flex-col gap-4 rounded-[14px] bg-white p-5 ${className}`}>
      <p className="text-[14px] leading-snug text-ink">
        Если вы владелец бизнеса или просто хотите получать новинки — подпишитесь на нашу группу в Telegram
      </p>
      <a
        href={tg?.url ?? "https://t.me/"}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#419FD9] px-5 text-sm font-semibold text-white hover:bg-[#3590c9]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/images/social/telegram.svg")} alt="" width={20} height={20} className="size-5" />
        Подписаться в Telegram
      </a>
    </div>
  );
}

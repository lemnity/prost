import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle, Send, SquarePlay } from "lucide-react";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { site, type SocialKey } from "@/content/site";

const socialIcons: Record<SocialKey, ReactNode> = {
  telegram: <Send size={16} />,
  whatsapp: <MessageCircle size={16} />,
  vk: <span className="text-[11px] font-bold leading-none">VK</span>,
  youtube: <SquarePlay size={16} />,
};

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line py-10">
      <Container className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.9fr_0.8fr_0.8fr_1.3fr_auto] lg:gap-10">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-block">
            <Image
              src="/images/brand/logo.svg"
              alt="ProStyle — бизнес-подарки"
              width={150}
              height={36}
              className="h-auto w-[150px]"
            />
          </Link>
          <p className="mt-7 text-xs leading-5 text-muted">
            © {year} ProStyle. Все права защищены.
            <br />
            Корпоративные подарки и сувенирная продукция в Тюмени.
          </p>
        </div>
        {site.footerLinks.map((col, i) => (
          <ul key={i} className="flex flex-col gap-2.5 text-[13px] text-muted">
            {col.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        ))}
        <ul className="flex flex-col gap-2.5 text-[13px] sm:col-span-2 lg:col-span-1 lg:border-l lg:border-line lg:pl-10">
          <li className="flex items-start gap-2 text-muted">
            <MapPin size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden />
            {site.address}
          </li>
          <li className="text-muted">{site.hours}</li>
          <li>
            <a href={site.phone.href} className="font-semibold text-ink hover:text-brand">
              {site.phone.label}
            </a>
          </li>
          <li>
            <a href={`mailto:${site.email}`} className="font-semibold text-ink hover:text-brand">
              {site.email}
            </a>
          </li>
        </ul>
        <ul className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
          {site.socials.map((s) => {
            const cls =
              "grid size-8 place-items-center rounded-full bg-[#5F6368] text-white";
            return (
              <li key={s.key}>
                {s.url ? (
                  <a href={s.url} aria-label={s.label} className={cls}>
                    {socialIcons[s.key]}
                  </a>
                ) : (
                  <span aria-hidden className={cls}>
                    {socialIcons[s.key]}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </footer>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SectionHeaderProps = {
  id: string;
  title: string;
  link?: { label: string; href: string };
  note?: string;
  aside?: ReactNode;
};

export function SectionHeader({ id, title, link, note, aside }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 md:mb-6">
      <h2 id={id} className="text-[22px] font-bold md:text-[26px]">
        {title}
      </h2>
      {aside || link || note ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {aside}
          {link ? (
            <Link
              href={link.href}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover md:shrink-0 md:text-[13px]"
            >
              {link.label}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ) : note ? (
            <p className="text-xs text-brand md:text-[13px]">{note}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

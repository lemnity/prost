import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SectionHeaderProps = {
  id: string;
  title: string;
  link?: { label: string; href: string };
  note?: string;
};

export function SectionHeader({ id, title, link, note }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4 md:mb-6">
      <h2 id={id} className="text-[22px] font-bold md:text-[26px]">
        {title}
      </h2>
      {link ? (
        <Link
          href={link.href}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover md:text-[13px]"
        >
          {link.label}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      ) : note ? (
        <p className="text-xs text-brand md:text-[13px]">{note}</p>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import { Zap } from "lucide-react";
import { Container } from "@/components/ui/container";
import { site } from "@/content/site";

export function CategoryNav() {
  return (
    <nav aria-label="Категории">
      <Container>
        <div className="no-scrollbar -mx-4 flex h-12 items-center gap-5 overflow-x-auto px-4 text-sm xl:text-[13px] text-ink md:-mx-8 md:px-8 xl:mx-0 xl:gap-4 xl:overflow-visible xl:px-2">
          <Zap size={16} fill="currentColor" aria-hidden className="shrink-0 text-brand" />
          <ul className="flex items-center gap-5 xl:flex-1 xl:justify-between xl:gap-0">
          {site.nav.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} className="whitespace-nowrap hover:text-brand">
                {item.label}
              </Link>
            </li>
          ))}
          </ul>
        </div>
      </Container>
    </nav>
  );
}

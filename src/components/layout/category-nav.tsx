import Link from "next/link";
import { Zap } from "lucide-react";
import { Container } from "@/components/ui/container";
import { site } from "@/content/site";

export function CategoryNav() {
  return (
    <nav aria-label="Категории">
      <Container>
        <ul className="no-scrollbar -mx-4 flex h-12 items-center gap-5 overflow-x-auto px-4 text-sm text-ink md:-mx-8 md:px-8 xl:mx-0 xl:justify-center xl:gap-3 xl:overflow-visible xl:px-0">
          <li aria-hidden className="shrink-0 text-brand">
            <Zap size={16} fill="currentColor" />
          </li>
          {site.nav.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} className="whitespace-nowrap hover:text-brand">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}

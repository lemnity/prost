import Link from "next/link";
import { Container } from "@/components/ui/container";
import { site } from "@/content/site";

export function CategoryNav() {
  return (
    <nav aria-label="Категории">
      <Container>
        <ul className="no-scrollbar flex h-11 items-center gap-6 overflow-x-auto text-[13px] font-semibold text-ink lg:justify-between lg:gap-0 lg:overflow-visible">
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

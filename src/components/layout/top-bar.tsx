import Link from "next/link";
import { MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { site } from "@/content/site";

export function TopBar() {
  return (
    <div className="hidden text-[13px] text-white md:block">
      <Container className="flex h-9 items-center justify-between gap-6">
        <p className="flex items-center gap-2">
          <MapPin size={14} className="text-white" aria-hidden />
          {site.address}
        </p>
        <ul className="hidden items-center gap-3 xl:flex">
          <li>{site.topbar.center[0]}</li>
          <li aria-hidden className="size-1 rounded-full bg-white/85" />
          <li>{site.topbar.center[1]}</li>
        </ul>
        <ul className="flex items-center gap-6">
          {site.topbar.links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}

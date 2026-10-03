import { MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { site } from "@/content/site";
import { socialIcons } from "./site-footer";

export function TopBar() {
  return (
    <div className="border-t-4 border-brand bg-[linear-gradient(90deg,#FBE4EA,#EEE6F6,#E4ECFB)] text-[13px] text-ink">
      <Container className="grid min-h-10 grid-cols-1 items-center gap-6 py-1.5 md:grid-cols-[1fr_auto_1fr] md:py-0">
        <p className="hidden items-center gap-2 lg:flex">
          <MapPin size={14} className="text-brand" aria-hidden />
          {site.address}
        </p>
        <ul className="flex items-center justify-center gap-3 md:col-start-2 md:col-end-3 lg:col-start-2">
          <li className="shrink-0 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white">
            B2B
          </li>
          <li>{site.topbar.center[0]}</li>
          <li aria-hidden className="hidden size-1 rounded-full bg-brand xl:block" />
          <li className="hidden xl:block">{site.topbar.center[1]}</li>
        </ul>
        <ul className="hidden items-center justify-end gap-3 md:flex md:col-start-3">
          {site.socials.map((s) => (
            <li key={s.key}>
              {s.url ? (
                <a
                  href={s.url}
                  aria-label={s.label}
                  className="grid size-6 place-items-center hover:text-brand"
                >
                  {socialIcons[s.key]}
                </a>
              ) : (
                <span aria-hidden className="grid size-6 place-items-center">
                  {socialIcons[s.key]}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}

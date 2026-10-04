import { MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { site } from "@/content/site";
import { SocialLinks } from "./social-links";

export function TopBar() {
  return (
    <div className="border-t-4 border-brand bg-[linear-gradient(90deg,#FBE4EA,#EEE6F6,#E4ECFB)] text-[13px] text-ink">
      <Container className="grid h-10 grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        <p className="hidden items-center gap-2 lg:flex">
          <MapPin size={14} className="text-brand" aria-hidden />
          {site.address}
        </p>
        <ul className="flex items-center justify-center gap-3 whitespace-nowrap md:col-start-2 md:col-end-3 lg:col-start-2">
          <li className="shrink-0 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white">
            B2B
          </li>
          <li className="hidden md:block">{site.topbar.center[0]}</li>
          <li aria-hidden className="hidden size-1 rounded-full bg-brand xl:block" />
          <li className="md:hidden xl:block">{site.topbar.center[1]}</li>
        </ul>
        <SocialLinks size={20} className="hidden justify-end gap-3 md:flex md:col-start-3" />
      </Container>
    </div>
  );
}

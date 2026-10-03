import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { reviews } from "@/content/home";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function Reviews() {
  return (
    <section aria-labelledby="reviews-title" className="py-5 md:py-6">
      <Container>
        <SectionHeader id="reviews-title" title={reviews.title} link={reviews.link} />
        <ul className="no-scrollbar -mx-4 flex scroll-px-4 snap-x gap-3 md:scroll-px-8 lg:scroll-px-0 overflow-x-auto px-4 md:-mx-8 md:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          {reviews.items.map((r) => (
            <li key={r.id} className="w-[300px] shrink-0 snap-start lg:w-auto">
              <figure className="h-full rounded-[10px] bg-surface p-5">
                <blockquote className="line-clamp-3 text-[13.5px] leading-relaxed text-ink/80">
                  {r.text}
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
                  >
                    {r.name.charAt(0)}
                  </span>
                  <span className="text-[13px] font-semibold">{r.name}</span>
                  <time dateTime={r.date} className="ml-auto text-xs text-muted">
                    {formatDate(r.date)}
                  </time>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

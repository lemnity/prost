import { FileImage, PencilLine, ShoppingBasket, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { steps, type StepIcon } from "@/content/home";

const icons = { basket: ShoppingBasket, file: FileImage, pen: PencilLine, truck: Truck } satisfies Record<StepIcon, unknown>;

export function HowWeWork() {
  return (
    <section aria-labelledby="how-we-work-title" className="my-5 bg-band-soft py-8 md:my-6 md:py-10">
      <Container>
        <SectionHeader id="how-we-work-title" title={steps.title} note={steps.note} />
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.items.map((s) => {
            const Icon = icons[s.icon];
            return (
              <li key={s.number} className="flex items-start gap-[14px] rounded-[24px] bg-white p-5">
                <span className="flex size-10 shrink-0 items-center justify-center">
                  <Icon size={36} strokeWidth={1.5} aria-hidden="true" className="text-ink" />
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-semibold tracking-wide text-brand">{s.number}</span>
                  <h3 className="mt-1 whitespace-nowrap text-[17px] font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

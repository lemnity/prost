import { FileImage, PencilLine, ShoppingBasket, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { steps, type StepIcon } from "@/content/home";

const icons = { basket: ShoppingBasket, file: FileImage, pen: PencilLine, truck: Truck } satisfies Record<StepIcon, unknown>;

export function HowWeWork() {
  return (
    <section aria-labelledby="how-we-work-title" className="py-6 md:py-8">
      <Container>
        <SectionHeader id="how-we-work-title" title={steps.title} note={steps.note} />
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.items.map((s) => {
            const Icon = icons[s.icon];
            return (
              <li key={s.number} className="relative min-h-[150px] rounded-[10px] bg-surface p-6">
                <span className="text-2xl font-light text-faint">{s.number}</span>
                <Icon
                  size={26}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="absolute right-6 top-6 text-brand"
                />
                <h3 className="mt-3 text-[15px] font-bold">{s.title}</h3>
                <p className="mt-2 text-[13px] text-muted">{s.text}</p>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

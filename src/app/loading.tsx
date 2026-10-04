import { BrandLoader } from "@/components/ui/brand-loader";

export default function Loading() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 py-16">
      <BrandLoader size={64} hideVisibleLabel />
      <p className="text-[13px] text-muted" aria-hidden="true">
        Загружаем…
      </p>
    </div>
  );
}

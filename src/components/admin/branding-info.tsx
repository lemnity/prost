import { Paperclip } from "lucide-react";
import type { Branding } from "@/lib/cart/branding";

const fileUrl = (id: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/${id}`;

/** Нанесение позиции для менеджера: способ, комментарий, расчёт и файлы логотипа. */
export function BrandingInfo({ b }: { b: Branding }) {
  return (
    <span className="mt-1 block rounded-md bg-brand-soft px-2 py-1 text-[12px] text-ink">
      <span className="font-semibold text-brand">Нанесение:</span> {b.method}
      {b.comment ? <span className="text-muted"> · {b.comment}</span> : null}
      {b.estimate ? <span> · расчёт {b.estimate}</span> : null}
      {b.files?.length ? (
        <span className="mt-0.5 flex flex-wrap gap-x-3">
          {b.files.map((f) => (
            <a key={f.id} href={fileUrl(f.id)} target="_blank" rel="noopener" className="inline-flex items-center gap-1 underline hover:text-brand">
              <Paperclip size={12} aria-hidden="true" /> {f.name}
            </a>
          ))}
        </span>
      ) : null}
    </span>
  );
}

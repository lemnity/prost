import { FileText } from "lucide-react";
import type { ProductFile } from "@/lib/catalog/files";

const BADGE: Record<string, string> = {
  pdf: "#E2574C",
  cdr: "#6FB33F",
  mp4: "#7C5CD6",
  docx: "#2B6CC4",
  jpg: "#E8A317",
};

/** Вкладка «Файлы»: плитки с цветным значком формата. Файлы лежат на prostyle.gifts. */
export function ProductFiles({ files }: { files: ProductFile[] }) {
  return (
    <div>
      <p className="max-w-[820px] text-[15px] leading-relaxed text-ink/90">
        Скачайте файл конструктора в удобном вам формате, откройте и отредактируйте его в любом векторном
        редакторе. Затем сохраните как векторный PDF и присоедините к заказу. Пожалуйста, будьте внимательны:
        файлы с растровыми изображениями подходят только для некоторых цифровых методов печати.
      </p>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {files.map((f, i) => {
          const ext = f.ext.toLowerCase();
          const video = ext === "mp4";
          return (
            <li key={`${f.url}-${i}`}>
              <a
                href={f.url}
                {...(video ? {} : { download: f.name })}
                target="_blank"
                rel="noopener noreferrer"
                title={f.name}
                className="flex items-center gap-3 rounded-[12px] border border-line bg-white p-3 hover:border-brand"
              >
                <span className="relative grid size-12 shrink-0 place-items-center rounded-lg bg-surface text-muted">
                  <FileText size={26} aria-hidden="true" />
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 -right-1 rounded px-1 py-px text-[10px] font-bold uppercase leading-3 text-white"
                    style={{ background: BADGE[ext] ?? "#8A8C8F" }}
                  >
                    {ext.slice(0, 4)}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-ink">{f.name}</span>
                  <span className="mt-0.5 block text-[13px] font-medium text-brand">
                    {video ? "Смотреть" : "Скачать"}
                    <span className="sr-only">: {f.name}</span>
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

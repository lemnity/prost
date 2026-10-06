// Файлы товаров (макеты, инструкции): ссылки на prostyle.gifts, сами файлы в репозитории не хранятся.
// Только для сервера: страницы товаров.
import raw from "@/data/catalog-files.json";

export type ProductFile = { name: string; ext: string; url: string };

const data = raw as unknown as Record<string, ProductFile[]>;
const ORDER = ["pdf", "cdr"];

export function getProductFiles(url: string, sku: string): ProductFile[] {
  const list = (data[url] ?? []).map((f) =>
    f.ext.includes("printproof")
      ? { ...f, ext: "pdf", name: `${sku} — макет нанесения.pdf` }
      : f,
  );
  const rank = (e: string) => {
    const i = ORDER.indexOf(e);
    return i < 0 ? ORDER.length : i;
  };
  return list
    .map((f, i) => ({ f, i }))
    .sort((a, b) => rank(a.f.ext) - rank(b.f.ext) || a.i - b.i)
    .map((x) => x.f);
}

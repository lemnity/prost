import { listProducts, type ListParams, type Sort } from "@/server/catalog";
import { COLLECTIONS, isCollection } from "@/server/catalog-routes";
import { FACETS, type FacetKind } from "@/lib/catalog/facets";
import { fail, ok, readJson } from "@/server/http";

/** Тот же запрос, что у страницы раздела/поиска/подборки (см. ListRequest в product-grid). */
export type ListRequest = {
  category?: number;
  collection?: string;
  q?: string;
  priceFrom?: number;
  priceTo?: number;
  inStock?: boolean;
  isNew?: boolean;
  facets?: Partial<Record<FacetKind, string[]>>;
  sort?: Sort;
};

const SORTS: Sort[] = ["popular", "cheap", "expensive", "stock", "new"];
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined);

/** Следующая страница выдачи для кнопки «Показать ещё». */
export async function POST(req: Request) {
  const body = await readJson<ListRequest & { page?: number }>(req);
  if (!body) return fail(400, "Некорректный запрос");
  const page = Math.max(2, Math.min(500, Math.floor(Number(body.page) || 2)));
  const facets: ListParams["facets"] = {};
  for (const f of FACETS) {
    const v = body.facets?.[f.kind];
    if (Array.isArray(v)) facets[f.kind] = v.filter((x): x is string => typeof x === "string" && /^[a-z0-9-]{1,32}$/.test(x)).slice(0, 20);
  }
  const params: ListParams = {
    category: num(body.category),
    q: typeof body.q === "string" ? body.q.slice(0, 100) : undefined,
    priceFrom: num(body.priceFrom),
    priceTo: num(body.priceTo),
    inStock: body.inStock === true,
    isNew: body.isNew === true,
    facets,
    sort: SORTS.includes(body.sort as Sort) ? body.sort : "popular",
    page,
  };
  if (body.collection) {
    if (!isCollection(body.collection)) return fail(400, "Неизвестная подборка");
    const col = COLLECTIONS[body.collection];
    params.sale = col.sale;
    params.theme = col.theme;
    params.inStock = params.inStock || col.inStock;
    if (params.sort === "popular") params.sort = col.sort;
  }
  if (!params.category && !params.q && !body.collection) return fail(400, "Нет раздела");
  const { items, total } = await listProducts(params);
  return ok({ items, total, page }, { headers: { "Cache-Control": "no-store" } });
}

import { requireAdmin } from "@/server/admin";
import { fail, ok, readJson, str } from "@/server/http";
import { addBanner, adminBanners, deleteBanner, updateBanner } from "@/server/site";

export async function GET() {
  const a = await requireAdmin();
  if (a instanceof Response) return a;
  return ok({ banners: await adminBanners() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return fail(400, "Некорректный запрос");
  const error = await addBanner({ image: str(body.image), alt: str(body.alt, 300), href: str(body.href) });
  return error ? fail(400, error) : ok({ ok: true });
}

export async function PATCH(req: Request) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const body = await readJson<Record<string, unknown>>(req);
  const id = str(body?.id, 64);
  if (!body || !id) return fail(400, "Некорректный запрос");
  const error = await updateBanner(id, { image: str(body.image), alt: str(body.alt, 300), href: str(body.href) });
  return error ? fail(400, error) : ok({ ok: true });
}

export async function DELETE(req: Request) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id) return fail(400, "Некорректный запрос");
  await deleteBanner(id);
  return ok({ ok: true });
}

import { requireAdmin } from "@/server/admin";
import { fail, ok } from "@/server/http";
import { saveSiteImage } from "@/server/site";

/** Картинка для баннера или обложки новости: multipart file → { url: "/media/<id>" }. */
export async function POST(req: Request) {
  const a = await requireAdmin(true);
  if (a instanceof Response) return a;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "Некорректный запрос");
  }
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return fail(400, "Выберите картинку");
  const r = await saveSiteImage(file);
  return "error" in r ? fail(400, r.error) : ok(r);
}

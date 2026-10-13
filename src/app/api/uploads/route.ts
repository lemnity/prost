import { clientIp, fail, ok, sameOrigin } from "@/server/http";
import { tooManyAttempts } from "@/server/auth";
import { after } from "next/server";
import { cleanupDrafts, DRAFT, saveUploads } from "@/server/chat";
import { BRANDING_MAX_FILES } from "@/lib/cart/branding";

/** Загрузка логотипа/макета с карточки товара: multipart files[] → [{ id, name, size, type }]. */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  if (tooManyAttempts(`upload:${await clientIp()}`)) return fail(429, "Слишком много загрузок, попробуйте позже");
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "Некорректный запрос");
  }
  const files = form.getAll("files").filter((f): f is File => f instanceof File).slice(0, BRANDING_MAX_FILES);
  if (!files.length) return fail(400, "Выберите файл");
  const saved = await saveUploads(DRAFT, files);
  if (!saved.length) return fail(400, "Файл слишком большой (до 20 МБ)");
  after(() => cleanupDrafts().catch(() => {}));
  return ok({ files: saved });
}

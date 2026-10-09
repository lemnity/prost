import { endSession } from "@/server/auth";
import { fail, ok, sameOrigin } from "@/server/http";

export async function POST() {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  await endSession();
  return ok({ user: null });
}

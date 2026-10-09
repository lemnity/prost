import { requireAdmin } from "@/server/admin";
import { ok } from "@/server/http";
import { lastSync } from "@/server/oasis";

export async function GET() {
  const a = await requireAdmin();
  if (a instanceof Response) return a;
  return ok(await lastSync(), { headers: { "Cache-Control": "no-store" } });
}

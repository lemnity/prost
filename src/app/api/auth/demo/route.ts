import { exec, query, type Row } from "@/server/db";
import { hashPassword, startSession } from "@/server/auth";
import { fail, ok, sameOrigin } from "@/server/http";
import { openingMessages } from "@/lib/chat/agent";
import { DEMO, DEMO_DIALOG, demoOrders, demoProfile } from "@/lib/account/demo";
import { buildOrder } from "@/lib/cart/order-text";
import { mePayload } from "@/server/me";

/** Демо-доступ: пересоздаёт демо-кабинет с примерами и входит в него. */
export async function POST() {
  if (!(await sameOrigin())) return fail(403, "Запрос с другого сайта");
  const now = Date.now();
  const profile = demoProfile(now);
  const created = new Date(now - 120 * 86_400_000);
  let [u] = await query<Row & { id: number }>("SELECT id FROM users WHERE email = ?", [DEMO.email]);
  if (!u) {
    const r = await exec("INSERT INTO users (email, password_hash, profile, created_at, email_verified_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP())", [DEMO.email, await hashPassword(DEMO.password), JSON.stringify(profile), created]);
    u = { id: r.insertId } as Row & { id: number };
  } else {
    await exec("UPDATE users SET profile = ?, password_hash = ?, email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP()) WHERE id = ?", [JSON.stringify(profile), await hashPassword(DEMO.password), u.id]);
  }
  await exec("DELETE FROM messages WHERE order_number LIKE 'PS-DEMO-%'");
  await exec("DELETE FROM orders WHERE number LIKE 'PS-DEMO-%'");
  for (const o of demoOrders(now)) {
    const data = { name: "Анна Смирнова", phone: profile.phone, email: DEMO.email, company: profile.company, inn: profile.inn, delivery: "courier" as const, city: "", address: o.address ?? "", payment: "invoice" as const, comment: "" };
    await exec(
      `INSERT INTO orders (number, user_id, contact, items, total, delivery, payment, address, order_text, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [o.number, u.id, JSON.stringify({ name: data.name, phone: data.phone, email: data.email, company: data.company, inn: data.inn }), JSON.stringify(o.items), o.total, o.delivery, o.payment, o.address ?? null, `Демо-заявка ${o.number}\n\n${buildOrder(o.items, data).text}`, o.status ?? "new", new Date(o.date)],
    );
  }
  const first = demoOrders(now)[0];
  const started = now - 86_400_000;
  for (const m of openingMessages({ name: "Анна Викторовна", number: first.number, items: first.items, total: first.total }, started)) {
    await exec("INSERT INTO messages (order_number, role, text, type_at, visible_at) VALUES (?, 'agent', ?, ?, ?)", [first.number, m.text, m.typeAt, m.at]);
  }
  for (const m of DEMO_DIALOG) {
    await exec("INSERT INTO messages (order_number, role, text, visible_at, created_at) VALUES (?, ?, ?, ?, ?)", [first.number, m.role, m.text, started + m.offset, new Date(started + m.offset)]);
  }
  await startSession(u.id);
  return ok(await mePayload());
}

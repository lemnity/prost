import { currentUser, type DbUser } from "./auth";
import { ordersOf } from "./orders";

/** Ответ /api/me: пользователь и его заявки (или null). */
export async function mePayload(user?: DbUser | null) {
  const u = user === undefined ? await currentUser() : user;
  if (!u) return { user: null };
  return { user: { profile: u.profile, createdAt: u.createdAt, role: u.role, emailVerified: u.emailVerified }, orders: await ordersOf(u.id) };
}

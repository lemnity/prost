import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { exec, json, query, type Row } from "./db";
import type { Profile } from "@/lib/account/store";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "ps_session";
export const GUEST_COOKIE = "ps_guest";
const SESSION_DAYS = 30;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const token = (bytes = 32) => randomBytes(bytes).toString("base64url");

/** scrypt$<salt>$<hash> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(password, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

export type DbUser = { id: number; email: string; role: "user" | "admin"; profile: Profile; createdAt: string };

type UserRow = Row & { id: number; email: string; role: "user" | "admin"; profile: unknown; created_at: Date; password_hash: string };

export const toUser = (r: UserRow): DbUser => ({
  id: r.id,
  email: r.email,
  role: r.role,
  profile: { ...json<Profile>(r.profile), email: r.email },
  createdAt: new Date(r.created_at).toISOString(),
});

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await query<UserRow>("SELECT * FROM users WHERE email = ? LIMIT 1", [email.trim().toLowerCase()]);
  return rows[0] ?? null;
}

const cookieOpts = (maxAgeSec: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: maxAgeSec,
});

export async function startSession(userId: number) {
  const t = token();
  await exec("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))", [
    sha256(t),
    userId,
    SESSION_DAYS,
  ]);
  (await cookies()).set(SESSION_COOKIE, t, cookieOpts(SESSION_DAYS * 86400));
  await claimGuestOrders(userId);
}

export async function endSession() {
  const jar = await cookies();
  const t = jar.get(SESSION_COOKIE)?.value;
  if (t) await exec("DELETE FROM sessions WHERE token_hash = ?", [sha256(t)]);
  jar.delete(SESSION_COOKIE);
}

/** Текущий пользователь по cookie сессии. */
export async function currentUser(): Promise<DbUser | null> {
  const t = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!t) return null;
  const rows = await query<UserRow>(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1",
    [sha256(t)],
  );
  return rows[0] ? toUser(rows[0]) : null;
}

/** Токен гостя (заявки без кабинета): выдаётся при первой заявке, хранится в httpOnly cookie. */
export async function guestHash(create: boolean): Promise<string | null> {
  const jar = await cookies();
  let t = jar.get(GUEST_COOKIE)?.value;
  if (!t && create) {
    t = token();
    jar.set(GUEST_COOKIE, t, cookieOpts(365 * 86400));
  }
  return t ? sha256(t) : null;
}

/** Заявки, оформленные гостем в этом браузере, переходят в кабинет при входе/регистрации. */
async function claimGuestOrders(userId: number) {
  const g = await guestHash(false);
  if (g) await exec("UPDATE orders SET user_id = ? WHERE guest_hash = ? AND user_id IS NULL", [userId, g]);
}

// --- Защита от подбора пароля: не больше 10 попыток за 10 минут с одного IP+email. ---
const attempts = new Map<string, number[]>();
export function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const list = (attempts.get(key) ?? []).filter((t) => now - t < 600_000);
  list.push(now);
  attempts.set(key, list);
  if (attempts.size > 5000) attempts.clear();
  return list.length > 10;
}

import { exec } from "./db";
import { sha256, token, type DbUser } from "./auth";
import { sendMail } from "./notify";
import { verifyEmail } from "./emails";
import { greetName } from "@/lib/account/store";

const VERIFY_DAYS = 3;

/** Новая ссылка подтверждения почты (старые ссылки пользователя аннулируются). */
export async function sendVerification(user: Pick<DbUser, "id" | "email" | "profile">): Promise<boolean> {
  const t = token();
  await exec("DELETE FROM email_tokens WHERE user_id = ? AND kind = 'verify'", [user.id]);
  await exec("INSERT INTO email_tokens (token_hash, user_id, kind, expires_at) VALUES (?, ?, 'verify', DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))", [
    sha256(t),
    user.id,
    VERIFY_DAYS,
  ]);
  const link = `${process.env.SITE_URL || "https://prostyle.agency"}/api/auth/verify?token=${t}`;
  const mail = verifyEmail(greetName(user.profile), link);
  return sendMail({ to: user.email, ...mail });
}

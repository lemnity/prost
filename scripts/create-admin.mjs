// Создаёт или обновляет администратора: node scripts/create-admin.mjs email@домен "Имя" [пароль]
// Без пароля генерирует случайный и печатает его. Нужен DATABASE_URL (берётся из окружения).
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import mysql from "mysql2/promise";

const scrypt = promisify(scryptCb);
const [email, name = "Администратор", given] = process.argv.slice(2);
if (!email) {
  console.error("Использование: node scripts/create-admin.mjs email [имя] [пароль]");
  process.exit(1);
}
const password = given || randomBytes(9).toString("base64url");
const salt = randomBytes(16);
const hash = await scrypt(password, salt, 64);
const passwordHash = `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
const profile = { name, lastName: "", middleName: "", email, phone: "", company: "ProStyle", inn: "", city: "", address: "", marketing: false };

const db = await mysql.createConnection({ uri: process.env.DATABASE_URL, charset: "utf8mb4" });
const [rows] = await db.query("SHOW TABLES LIKE 'users'");
if (!rows.length) {
  console.error("Таблиц ещё нет — откройте сайт один раз (они создаются при первом запросе) и повторите.");
  process.exit(1);
}
await db.query(
  `INSERT INTO users (email, password_hash, role, profile, email_verified_at) VALUES (?, ?, 'admin', ?, UTC_TIMESTAMP())
   ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin', email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP())`,
  [email.toLowerCase(), passwordHash, JSON.stringify(profile)],
);
await db.end();
console.log(`Администратор: ${email.toLowerCase()}\nПароль: ${password}`);

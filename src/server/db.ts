import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";

/** Пул соединений с MySQL (DATABASE_URL в /opt/prostyle/.env). Таблицы создаются при первом запросе. */
const g = globalThis as unknown as { __psPool?: Pool; __psMigrated?: Promise<void> };

function pool(): Pool {
  if (!g.__psPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL не задан");
    g.__psPool = mysql.createPool({ uri: url, connectionLimit: 5, charset: "utf8mb4", timezone: "Z", dateStrings: false });
  }
  return g.__psPool;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user','admin') NOT NULL DEFAULT 'user',
    profile JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash CHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    INDEX (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number VARCHAR(32) NOT NULL UNIQUE,
    user_id INT NULL,
    guest_hash CHAR(64) NULL,
    contact JSON NOT NULL,
    items JSON NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    delivery VARCHAR(64) NOT NULL,
    payment VARCHAR(64) NOT NULL,
    address TEXT NULL,
    comment TEXT NULL,
    promo VARCHAR(32) NULL,
    order_text TEXT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'new',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id), INDEX (guest_hash), INDEX (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(32) NOT NULL,
    role ENUM('user','agent','manager') NOT NULL,
    text TEXT NOT NULL,
    files JSON NULL,
    type_at BIGINT NULL,
    visible_at BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (order_number, id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS files (
    id CHAR(24) PRIMARY KEY,
    order_number VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    size INT NOT NULL,
    mime VARCHAR(120) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (order_number)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS email_tokens (
    token_hash CHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    kind VARCHAR(16) NOT NULL,
    expires_at DATETIME NOT NULL,
    INDEX (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS oasis_products (
    article VARCHAR(64) PRIMARY KEY,
    oasis_id VARCHAR(32) NOT NULL,
    group_id VARCHAR(32) NULL,
    name VARCHAR(400) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    old_price DECIMAL(12,2) NULL,
    stock INT NOT NULL DEFAULT 0,
    remote INT NOT NULL DEFAULT 0,
    deleted TINYINT(1) NOT NULL DEFAULT 0,
    synced_at DATETIME NOT NULL,
    INDEX (oasis_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(32) NOT NULL,
    started_at DATETIME NOT NULL,
    finished_at DATETIME NULL,
    items INT NOT NULL DEFAULT 0,
    error TEXT NULL,
    INDEX (source, id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kind VARCHAR(16) NOT NULL,
    data JSON NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'new',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (kind, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

/** Изменения уже созданных таблиц (MySQL 8 не умеет ADD COLUMN IF NOT EXISTS — дубликаты пропускаем). */
const ALTERS = [
  "ALTER TABLE users ADD COLUMN email_verified_at DATETIME NULL",
];

function migrate(): Promise<void> {
  if (!g.__psMigrated) {
    g.__psMigrated = (async () => {
      for (const sql of SCHEMA) await pool().query(sql);
      for (const sql of ALTERS) {
        try {
          await pool().query(sql);
        } catch (e) {
          if ((e as { errno?: number }).errno !== 1060) throw e; // 1060 — поле уже есть
        }
      }
    })().catch((e) => {
      g.__psMigrated = undefined;
      throw e;
    });
  }
  return g.__psMigrated;
}

export async function query<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
  await migrate();
  const [rows] = await pool().query<T[]>(sql, params);
  return rows;
}

export async function exec(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  await migrate();
  const [res] = await pool().query<ResultSetHeader>(sql, params);
  return res;
}

export type Row = RowDataPacket;

/** mysql2 отдаёт JSON-колонки уже разобранными, но на всякий случай поддерживаем строку. */
export const json = <T>(v: unknown): T => (typeof v === "string" ? (JSON.parse(v) as T) : (v as T));

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Почта и уведомления. Настройки — в /opt/prostyle/.env:
 *  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM — отправка (127.0.0.1:25 — свой Postfix с DKIM, без логина);
 *  MAIL_REPLY_TO — куда приходят ответы клиентов на письма;
 *  MAIL_TO   — менеджерам (через запятую), по умолчанию pro-style24@bk.ru;
 *  MAIL_COPY — скрытая копия всех писем клиентам, по умолчанию pro-style24@bk.ru;
 *  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID — дубль уведомлений в Telegram (по желанию).
 * Без SMTP письма не уходят (пишем в лог), заявки и чат всё равно сохраняются.
 */
const MANAGERS = (process.env.MAIL_TO || "pro-style24@bk.ru").split(",").map((s) => s.trim()).filter(Boolean);
const COPY = process.env.MAIL_COPY ?? "pro-style24@bk.ru";

let transport: Transporter | null | undefined;
function smtp(): Transporter | null {
  if (transport !== undefined) return transport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return (transport = null);
  const port = Number(SMTP_PORT || (SMTP_USER ? 465 : 25));
  const local = SMTP_HOST === "127.0.0.1" || SMTP_HOST === "localhost";
  transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    // Свой Postfix на этом же сервере — без логина и без TLS; внешний SMTP — с авторизацией.
    ...(SMTP_USER && SMTP_PASS ? { auth: { user: SMTP_USER, pass: SMTP_PASS } } : {}),
    ...(local ? { ignoreTLS: true } : {}),
  });
  return transport;
}

export type Mail = { to: string | string[]; subject: string; text: string; html?: string; copy?: boolean };

/** Письмо. copy — скрытая копия на MAIL_COPY (все письма клиентам дублируются менеджеру). */
export async function sendMail({ to, subject, text, html, copy = true }: Mail): Promise<boolean> {
  const t = smtp();
  const recipients = [to].flat().filter(Boolean);
  if (!t || !recipients.length) {
    console.info(`[mail] ${subject} → ${recipients.join(", ")} (SMTP не настроен, письмо не отправлено)`);
    return false;
  }
  try {
    const from = process.env.MAIL_FROM || `ProStyle <${process.env.SMTP_USER || "noreply@prostyle.agency"}>`;
    const replyTo = process.env.MAIL_REPLY_TO || undefined;
    const bcc = copy && COPY && !recipients.includes(COPY) ? COPY : undefined;
    const info = await t.sendMail({ from, replyTo, to: recipients, bcc, subject, text, html });
    // Тестовый SMTP (ethereal.email) — ссылка на предпросмотр письма в лог.
    if (process.env.SMTP_HOST?.includes("ethereal")) console.info(`[mail] предпросмотр: ${nodemailer.getTestMessageUrl(info)}`);
    return true;
  } catch (e) {
    console.error(`[mail] ошибка отправки «${subject}»:`, e);
    return false;
  }
}

/** Уведомление менеджерам: почта на MAIL_TO (+ Telegram, если настроен). */
export async function notifyManager(subject: string, text: string, html?: string): Promise<void> {
  const jobs: Promise<unknown>[] = [sendMail({ to: MANAGERS, subject, text, html, copy: false })];
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: `${subject}\n\n${text}`.slice(0, 4000) }),
      }).catch((e) => console.error("[telegram] ошибка:", e)),
    );
  }
  await Promise.all(jobs);
}

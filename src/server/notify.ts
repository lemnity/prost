import nodemailer from "nodemailer";

/**
 * Уведомления менеджеру. Работают каналы, для которых заданы настройки в /opt/prostyle/.env:
 *  — почта: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (и MAIL_TO, MAIL_FROM);
 *  — Telegram: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
 * Без настроек заявка всё равно сохраняется в базе и видна в админке.
 */
export async function notifyManager(subject: string, text: string): Promise<void> {
  const jobs: Promise<unknown>[] = [];
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS && MAIL_TO) {
    const port = Number(SMTP_PORT || 465);
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
    jobs.push(transport.sendMail({ from: MAIL_FROM || SMTP_USER, to: MAIL_TO, subject, text }));
  }
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: `${subject}\n\n${text}`.slice(0, 4000) }),
      }),
    );
  }
  if (!jobs.length) {
    console.info(`[notify] ${subject} (каналы уведомлений не настроены)`);
    return;
  }
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("[notify] ошибка отправки:", r.reason);
}

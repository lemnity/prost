import { site } from "@/content/site";
import { formatPriceValue } from "@/lib/format";
import { cartDiscount, type CartItem } from "@/lib/cart/store";

const SITE = () => process.env.SITE_URL || "https://prostyle.agency";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const BRAND = "#d02e31";
const INK = "#1a1a1a";
const MUTED = "#6b6b78";

/** Общий макет письма (таблицы + inline-стили — для Mail.ru, Яндекса, Gmail, Outlook). */
function layout(preheader: string, body: string): string {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ProStyle</title></head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:${INK}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td height="6" bgcolor="${BRAND}" style="height:6px;line-height:6px;font-size:0;background:${BRAND};background-image:linear-gradient(90deg,#b8232b 0%,${BRAND} 35%,#ec5b3c 70%,#f7c8b5 100%)">&nbsp;</td></tr>
<tr><td style="padding:28px 28px 22px;border-bottom:1px solid #ececea">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td valign="middle">
      <a href="${SITE()}" style="text-decoration:none">
        <img src="${SITE()}/images/brand/logo-email.png" width="180" height="44" alt="PRO STYLE — Business Gifts" style="display:block;border:0;outline:none;width:180px;height:44px;color:#444551;font-size:20px;font-weight:bold">
      </a>
    </td>
    <td valign="middle" align="right">
      <a href="${SITE()}/account" style="display:inline-block;padding:9px 14px;border:1px solid ${BRAND};border-radius:10px;color:${BRAND};font-size:13px;font-weight:bold;text-decoration:none;white-space:nowrap">Личный кабинет</a>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:28px">${body}</td></tr>
<tr><td style="padding:20px 28px;background:#fafaf9;border-top:1px solid #ececea;font-size:12px;line-height:18px;color:${MUTED}">
  ProStyle — корпоративные подарки и сувенирная продукция.<br>
  ${esc(site.address)} · <a href="${site.phone.href}" style="color:${MUTED}">${esc(site.phone.label)}</a> · <a href="mailto:${site.email}" style="color:${MUTED}">${esc(site.email)}</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:${BRAND};border-radius:10px">
<a href="${href}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none">${esc(label)}</a></td></tr></table>`;

const p = (html: string, style = "") => `<p style="margin:0 0 14px;font-size:15px;line-height:23px;${style}">${html}</p>`;

/** «Подтверждение почты» после регистрации. */
export function verifyEmail(name: string, link: string) {
  const subject = "Подтверждение почты — ProStyle";
  const html = layout(
    "Подтвердите адрес электронной почты для личного кабинета ProStyle",
    `<h1 style="margin:0 0 16px;font-size:24px;line-height:30px">Подтвердите почту</h1>
${p(`Здравствуйте${name ? `, ${esc(name)}` : ""}! Вы создали личный кабинет на сайте ProStyle.`)}
${p("Чтобы подтвердить адрес электронной почты, нажмите кнопку:")}
${button(link, "Подтвердить почту")}
${p(`Если кнопка не работает, откройте ссылку: <a href="${link}" style="color:${BRAND};word-break:break-all">${esc(link)}</a>`, `font-size:13px;color:${MUTED}`)}
${p("Ссылка действует 3 дня. Если вы не регистрировались — просто проигнорируйте это письмо.", `font-size:13px;color:${MUTED}`)}`,
  );
  const text = `Здравствуйте${name ? `, ${name}` : ""}!\n\nВы создали личный кабинет на сайте ProStyle. Подтвердите адрес электронной почты по ссылке:\n${link}\n\nСсылка действует 3 дня. Если вы не регистрировались — проигнорируйте письмо.\n\nProStyle, ${site.phone.label}`;
  return { subject, html, text };
}

type OrderMail = {
  number: string;
  name: string;
  items: CartItem[];
  total: number;
  delivery: string;
  payment: string;
  address: string;
  comment: string;
  chatLink: string;
  cancelLink: string;
};

/** «Ваш заказ» — подтверждение клиенту. */
export function orderEmail(o: OrderMail) {
  const subject = `Ваш заказ № ${o.number} — ProStyle`;
  const discount = cartDiscount(o.items);
  const rows = o.items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #ececea;font-size:14px;line-height:20px">${esc(i.title)}${i.preorder ? ` <span style="color:#b45309">(под заказ)</span>` : ""}<br><span style="color:${MUTED};font-size:12px">Арт. ${esc(i.sku)} · ${i.qty} шт × ${formatPriceValue(i.price)}</span></td>
<td align="right" style="padding:10px 0 10px 12px;border-bottom:1px solid #ececea;font-size:14px;font-weight:bold;white-space:nowrap">${formatPriceValue(i.qty * i.price)}</td></tr>`,
    )
    .join("");
  const html = layout(
    `Заказ № ${o.number} принят — менеджер свяжется с вами`,
    `<h1 style="margin:0 0 16px;font-size:24px;line-height:30px">Спасибо за заказ!</h1>
${p(`Здравствуйте${o.name ? `, ${esc(o.name)}` : ""}! Мы получили ваш заказ <b>№ ${esc(o.number)}</b>. Персональный менеджер уже изучает корзину и свяжется с вами в рабочее время (${esc(site.hours.toLowerCase())}).`)}
${p("Также у вас есть свой виртуальный менеджер Виктория, которая доступна в вашем личном кабинете и может ответить на все интересующие вопросы.")}
${button(o.chatLink, "Написать Виктории")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px">${rows}
${discount > 0 ? `<tr><td style="padding:10px 0 0;font-size:14px;color:${BRAND}">Скидка</td><td align="right" style="padding:10px 0 0;font-size:14px;color:${BRAND}">−${formatPriceValue(discount)}</td></tr>` : ""}
<tr><td style="padding:10px 0 0;font-size:16px;font-weight:bold">Итого</td><td align="right" style="padding:10px 0 0;font-size:18px;font-weight:bold;white-space:nowrap">от ${formatPriceValue(o.total)}</td></tr></table>
${p(`<b>Получение:</b> ${esc(o.delivery)}${o.address ? ` — ${esc(o.address)}` : ""}<br><b>Оплата:</b> ${esc(o.payment)}${o.comment ? `<br><b>Комментарий:</b> ${esc(o.comment)}` : ""}`, "font-size:14px")}
${p("Цены указаны без нанесения логотипа — менеджер рассчитает нанесение и пришлёт макет. Логотип можно отправить прямо в чат.", `font-size:13px;color:${MUTED}`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid #ececea"><tr><td style="padding-top:18px">
  <a href="${o.cancelLink}" style="display:inline-block;padding:10px 18px;border:1px solid #d6d6d2;border-radius:10px;color:${MUTED};font-size:13px;font-weight:bold;text-decoration:none">Отменить заказ</a>
  <span style="display:block;margin-top:8px;font-size:12px;color:${MUTED}">Передумали? Нажмите «Отменить заказ» — менеджер сразу получит уведомление.</span>
</td></tr></table>`,
  );
  const lines = o.items.map((i) => `• ${i.title} — ${i.qty} шт × ${formatPriceValue(i.price)} = ${formatPriceValue(i.qty * i.price)}`).join("\n");
  const text = `Здравствуйте${o.name ? `, ${o.name}` : ""}!\n\nМы получили ваш заказ № ${o.number}. Персональный менеджер уже изучает корзину и свяжется с вами в рабочее время (${site.hours.toLowerCase()}).\n\nТакже у вас есть свой виртуальный менеджер Виктория, которая доступна в вашем личном кабинете и может ответить на все интересующие вопросы.\n\n${lines}\n${discount > 0 ? `Скидка: −${formatPriceValue(discount)}\n` : ""}Итого: от ${formatPriceValue(o.total)}\n\nПолучение: ${o.delivery}${o.address ? ` — ${o.address}` : ""}\nОплата: ${o.payment}\n\nЧат с менеджером: ${o.chatLink}\nОтменить заказ: ${o.cancelLink}\n\nProStyle, ${site.phone.label}`;
  return { subject, html, text };
}

type NewUserMail = { fullName: string; email: string; phone: string; company: string; inn: string; marketing: boolean; date: Date };

/** Администраторам — «Новый пользователь» (без пароля: он хранится только в виде хэша). */
export function newUserAdminEmail(u: NewUserMail) {
  const subject = `Новый пользователь — ${u.company || u.fullName || u.email}`;
  const when = u.date.toLocaleString("ru-RU", { timeZone: "Asia/Yekaterinburg", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const row = (k: string, v: string) =>
    `<tr><td style="padding:9px 12px 9px 0;border-bottom:1px solid #ececea;font-size:13px;color:${MUTED};white-space:nowrap;vertical-align:top">${k}</td><td style="padding:9px 0;border-bottom:1px solid #ececea;font-size:14px">${v}</td></tr>`;
  const html = layout(
    `Зарегистрировался новый пользователь: ${u.email}`,
    `<h1 style="margin:0 0 16px;font-size:24px;line-height:30px">Новый пользователь</h1>
${p(`На сайте зарегистрировался новый клиент — ${esc(when)} (Тюмень).`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 8px">
${row("Имя", esc(u.fullName || "—"))}
${row("Email", `<a href="mailto:${esc(u.email)}" style="color:${BRAND}">${esc(u.email)}</a>`)}
${row("Телефон", u.phone ? `<a href="tel:${esc(u.phone.replace(/[^\d+]/g, ""))}" style="color:${INK}">${esc(u.phone)}</a>` : "—")}
${row("Компания", esc(u.company || "—"))}
${row("ИНН", esc(u.inn || "—"))}
${row("Рассылки", u.marketing ? "Согласен получать" : "Не согласен")}
${row("Почта", "Ждёт подтверждения по ссылке из письма")}
</table>
${button(`${SITE()}/admin/users`, "Открыть в админке")}
${p("Пароль в письмах не передаётся: он хранится только в зашифрованном виде. Если клиент не может войти — задайте ему новый пароль в админке.", `font-size:13px;color:${MUTED}`)}`,
  );
  const text = `Новый пользователь — ${when}\n\nИмя: ${u.fullName || "—"}\nEmail: ${u.email}\nТелефон: ${u.phone || "—"}\nКомпания: ${u.company || "—"}\nИНН: ${u.inn || "—"}\nРассылки: ${u.marketing ? "согласен" : "не согласен"}\n\nАдминка: ${SITE()}/admin/users`;
  return { subject, html, text };
}

export type NavLink = { label: string; href: string };

export type SocialKey = "telegram" | "whatsapp" | "vk" | "youtube";
export type Social = { key: SocialKey; label: string; url: string | null };

export const site = {
  name: "ProStyle",
  address: "Тюмень, ул. Пышминская, 103",
  hours: "Ежедневно с 09:00 до 18:00",
  phone: { label: "+7 (3452) 550 995", href: "tel:+73452550995" },
  email: "pro-style@bk.ru",
  topbar: {
    center: [
      "Работаем с организациями и предпринимателями",
      "Минимальный заказ от 10 000 ₽",
    ],
    links: [
      { label: "О компании", href: "/about" },
      { label: "Доставка и оплата", href: "/delivery" },
      { label: "Контакты", href: "/contact-us" },
    ] satisfies NavLink[],
  },
  socials: [
    { key: "telegram", label: "Telegram", url: null },
    { key: "whatsapp", label: "WhatsApp", url: null },
    { key: "vk", label: "ВКонтакте", url: null },
    { key: "youtube", label: "YouTube", url: null },
  ] satisfies Social[],
  nav: [
    { label: "Новинки", href: "/catalog/new" },
    { label: "Хиты", href: "/catalog/hits" },
    { label: "Одежда", href: "/catalog/promo-odezhda" },
    { label: "Подарочные наборы", href: "/catalog/podarochnye-nabory" },
    { label: "Посуда", href: "/catalog/posuda" },
    { label: "Канцелярия", href: "/catalog/ejednevniki" },
    { label: "Сумки", href: "/catalog/sumki" },
    { label: "Электроника", href: "/catalog/elektronika" },
    { label: "Для дома", href: "/catalog/dom" },
    { label: "Для отдыха", href: "/catalog/puteshestvie-i-otdy-x" },
    { label: "Премиум", href: "/catalog/vip" },
    { label: "Новый год", href: "/catalog/novyy-god" },
    { label: "Брендирование", href: "/application-types" },
    { label: "Портфолио", href: "/portfolio" },
  ] satisfies NavLink[],
  footerLinks: [
    [
      { label: "Каталог", href: "/catalog" },
      { label: "Новинки", href: "/catalog/new" },
      { label: "Портфолио", href: "/portfolio" },
      { label: "О компании", href: "/about" },
    ],
    [
      { label: "Доставка и оплата", href: "/delivery" },
      { label: "Брендирование", href: "/application-types" },
      { label: "Отзывы", href: "/reviews" },
      { label: "Контакты", href: "/contact-us" },
    ],
  ] satisfies NavLink[][],
} as const;

export type HeroStatIcon = "gem" | "package" | "pen";
export type StepIcon = "basket" | "file" | "pen" | "truck";

export type Step = { number: string; icon: StepIcon; title: string; text: string };
export type Application = { id: string; title: string; text: string; href: string; image: string };
export type Work = { id: string; client: string; text: string; image: string; href: string };
export type Review = { id: string; name: string; date: string; text: string };
export type Client = { id: string; name: string; logo: string };

export const hero = {
  title: { line1: "Корпоративные подарки", line2: "и мерч с", accent: "вашим логотипом" },
  text: "Помогаем бизнесу, государственным и частным организациям создавать запоминающиеся подарки, которые работают на ваш бренд.",
  stats: [
    { icon: "gem", bold: "15+ лет", caption: "на рынке" },
    { icon: "package", bold: "от 10 000 ₽", caption: "минимальный заказ" },
    { icon: "pen", bold: "Нанесение логотипа", caption: "любым способом" },
  ] satisfies { icon: HeroStatIcon; bold: string; caption: string }[],
  primaryCta: { label: "Подобрать сувениры", href: "/catalog" },
  secondaryCta: { label: "Смотреть каталог", href: "/catalog" },
  image: "/images/hero/hero.webp",
} as const;

export const steps = {
  title: "Как мы работаем",
  note: "Простой процесс — отличный результат",
  items: [
    { number: "01", icon: "basket", title: "Вы выбираете товары", text: "Из каталога или с помощью нашего менеджера" },
    { number: "02", icon: "file", title: "Отправляете логотип", text: "Мы подготовим макет и предложим варианты нанесения" },
    { number: "03", icon: "pen", title: "Согласовываете макет", text: "Вносим правки до идеального результата" },
    { number: "04", icon: "truck", title: "Получаете заказ", text: "В срок и с гарантией качества" },
  ] satisfies Step[],
} as const;

export const applications = {
  title: "Виды нанесения",
  link: { label: "Подберем оптимальный способ под ваш бюджет и задачи", href: "/application-types" },
  items: [
    { id: "pad-press", title: "Тампопечать", text: "Для ручек, сувениров, пластика", href: "/application-types/pad-press", image: "/images/applications/tampo.webp" },
    { id: "silk-press", title: "Шелкография", text: "Яркие цвета на текстиле и отличная стойкость", href: "/application-types/silk-press", image: "/images/applications/shelk.webp" },
    { id: "laser-engraving", title: "Гравировка", text: "Премиальный и долговечный результат", href: "/application-types/laser-engraving", image: "/images/applications/gravirovka.webp" },
    { id: "uv-press", title: "УФ-печать", text: "Полноцветное нанесение на разные поверхности", href: "/application-types/uv-press", image: "/images/applications/uf.webp" },
    { id: "embroidery", title: "Вышивка", text: "Стильный результат на одежде и текстиле", href: "/application-types/embroidery", image: "/images/applications/vyshivka.webp" },
    { id: "embrossing", title: "Тиснение", text: "Эффектно и статусно на коже и ежедневниках", href: "/application-types/embrossing", image: "/images/applications/tisnenie.webp" },
  ] satisfies Application[],
} as const;

export const works = {
  title: "Наши работы",
  link: { label: "Смотреть все кейсы", href: "/portfolio" },
  items: [
    { id: "sibur", client: "СИБУР", text: "Корпоративные подарки для конференции", image: "/images/works/sibur.webp", href: "/portfolio" },
    { id: "tyumen", client: "Тюменская область", text: "Сувенирная продукция для делегации", image: "/images/works/tyumen.webp", href: "/portfolio" },
    { id: "zapsib", client: "ЗапСибНефтехим", text: "Брендированные наборы для сотрудников", image: "/images/works/zapsib.webp", href: "/portfolio" },
    { id: "events", client: "Мероприятия и выставки", text: "Промо-сувениры для участников", image: "/images/works/events.webp", href: "/portfolio" },
  ] satisfies Work[],
} as const;

// date хранится в ISO; в компонентах форматируется в «дд.мм.гггг».
export const reviews = {
  title: "Отзывы клиентов",
  link: { label: "Все отзывы", href: "/reviews" },
  items: [
    {
      id: "shirokov",
      name: "Александр Широков",
      date: "2026-02-03",
      text: "Большое спасибо «ПроСтиль» за крутой мерч для нашего фестиваля! Ребята, вы — молодцы! Сразу предложили удобные варианты наборов, помогли определиться. Менеджеры — настоящие профессионалы и просто приятные люди, всегда на связи и готовы помочь. А качество... Качество просто супер! Все вещи классные, стильные, отлично смотрятся и приятны к телу. Получили массу комплиментов от гостей! Очень довольны сотрудничеством и обязательно вернемся за новыми партиями мерча. Всем советуем!",
    },
    {
      id: "makeeva",
      name: "Дарья Макеева",
      date: "2025-08-28",
      text: 'Мы начинали с ручек, карандашей, футболок, затем пошли фирменные кружки, шопперы, электронная подарочная техника, затем нам отшили на заказ уличную очень классную дженгу для игр с детьми, дальше мы одели всех наших строителей, отдел продаж и не только в теплые крутые худи, полуверы и бомберы, нам изготовили великолепную складную выездную стойку и много чего, что было в голове - а потом каким-то чудесным образом воплощалось в реальности. Вся продукция очень классного качества, все материалы на высшем уровне. Мы от всей души хотим сказать СПАСИБО, пожелать дальнейшей слаженной работы, хороших клиентов и только позитива! С любовью - ваши преданные клиенты РД "Призвание"',
    },
    {
      id: "mozgovoy",
      name: "Сергей Мозговой",
      date: "2024-07-20",
      text: "Отличный ресурс! Заказывал первый раз. Сначала хотел просто заказать визитки по готовому макету, но приятно удивил конструктор визиток и выбор предоставленный шаблонов.",
    },
  ] satisfies Review[],
} as const;

export const clients = {
  title: "Нам доверяют",
  note: "И еще более 500 компаний по всей России",
  items: [
    { id: "sibur", name: "СИБУР", logo: "/images/clients/sibur.png" },
    { id: "lukoil", name: "ЛУКОЙЛ", logo: "/images/clients/lukoil.png" },
    { id: "rosneft", name: "Роснефть", logo: "/images/clients/rosneft.png" },
    { id: "gazprom", name: "Газпром", logo: "/images/clients/gazprom.png" },
    { id: "rzd", name: "РЖД", logo: "/images/clients/rzd.png" },
    { id: "sber", name: "Сбер", logo: "/images/clients/sber.png" },
    { id: "yandex", name: "Яндекс", logo: "/images/clients/yandex.png" },
    { id: "tyumen", name: "Тюменская область", logo: "/images/clients/tyumen.png" },
  ] satisfies Client[],
} as const;

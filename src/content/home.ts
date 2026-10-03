export type StepIcon = "basket" | "file" | "pen" | "truck";

export type Step = { number: string; icon: StepIcon; title: string; text: string };
export type Application = { id: string; title: string; text: string; term: string; run: string; href: string; image: string };
export type Work = { id: string; client: string; text: string; image: string; href: string };
export type Review = { id: string; name: string; date: string; text: string };
export type Client = { id: string; name: string; logo: string };

export type Banner = { id: string; image: string; alt: string };

export const banners: Banner[] = [
  { id: "vacation", image: "/images/banners/01.webp", alt: "В отпуск с комфортом — полезные мелочи для комфортной дороги" },
  { id: "knitwear", image: "/images/banners/02.webp", alt: "Это вам не конь в пальто! Тепло и уют в каждом стежке — вязаные шапки, шарфы и варежки с логотипом" },
  { id: "welcome-pack", image: "/images/banners/03.webp", alt: "Welcome Pack — поможет новичкам влиться в команду" },
  { id: "trends", image: "/images/banners/04.webp", alt: "Свежие тренды в сувенирах — сделай маркетинг оригинальным" },
  { id: "vip", image: "/images/banners/05.webp", alt: "VIP-подарки — бизнес-партнеры теперь друзья" },
];

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
    { id: "embrossing", title: "Тиснение", text: "Тиснение предназначено для работы с мягкими материалами: кожи, кожзаменителя, а также бумаги с высокой плотностью. Это делает её незаменимым инструментом для брендирования офисной продукции, аксессуаров и промо материалов.", term: "Срок изготовления 5–\u20607\u00a0дней", run: "Тираж от 500 до\u00a05\u00a0000\u00a0шт.", href: "/application-types/embrossing", image: "/images/applications/embrossing.webp" },
    { id: "uv-press", title: "УФ-печать", text: "Этот вид печати позволяет переносить изображения большого размера с высоким разрешением. Чаще всего её применяют для оформления и брендирования маркетинговой и B2B продукции из пластика, бумаги, кожзама, дерева или металла.", term: "Срок изготовления 2–\u20607\u00a0дней", run: "Тираж от 1 до\u00a010\u00a0000\u00a0шт.", href: "/application-types/uv-press", image: "/images/applications/uv-press.webp" },
    { id: "pad-press", title: "Тампопечать", text: "Это универсальный и распространенный способ перенести двухмерное изображение на любую поверхность. С помощью неё вы сможете легко сделать так, чтобы любая продукция соответствовала айдентике организации, компании или события.", term: "Срок изготовления 2–\u20607\u00a0дней", run: "Тираж от 1 до\u00a010\u00a0000\u00a0шт.", href: "/application-types/pad-press", image: "/images/applications/pad-press.webp" },
    { id: "silk-press", title: "Шелкография", text: "Это один из самых распространенных способов нанесения изображения на бизнес-сувениры. Секрет её популярности — в универсальности: изображение можно нанести на изделие практически из любого материала: ткани, металла или дерева.", term: "Срок изготовления 2–\u20607\u00a0дней", run: "Тираж от 1 до\u00a010\u00a0000\u00a0шт.", href: "/application-types/silk-press", image: "/images/applications/silk-press.webp" },
    { id: "sublime-press", title: "Сублимационная печать", text: "Эта технология позволяет перенести изображение со специальной бумаги на изделие под воздействием термопресса. Её можно использовать для керамики (кружки, тарелки) или синтетических тканей (футболки, толстовки) светлых цветов.", term: "Срок изготовления 2–\u20607\u00a0дней", run: "Тираж от 1 до\u00a010\u00a0000\u00a0шт.", href: "/application-types/sublime-press", image: "/images/applications/sublime-press.webp" },
    { id: "dome-stickers", title: "Объемная наклейка", text: "Наклейки с эффектом объёма активно используются для украшения сувенирной и фирменной продукции. Особенность данной технологии делает её идеально подходящей для нанесения на поверхности со сложным рельефом.", term: "Срок изготовления 5–\u20607\u00a0дней", run: "Тираж от 500 до\u00a05\u00a0000\u00a0шт.", href: "/application-types/dome-stickers", image: "/images/applications/dome-stickers.webp" },
    { id: "dtg", title: "Прямая печать", text: "Прямая печать на ткани появилась сравнительно недавно, но уже обрела большую популярность. Она позволяет минимальной предпроцессной подготовкой нанести полноцветное изображение на текстильные изделия и одежду.", term: "Срок изготовления 2–\u20607\u00a0дней", run: "Тираж от 1 до\u00a01\u00a0000\u00a0шт.", href: "/application-types/dtg", image: "/images/applications/dtg.webp" },
    { id: "embroidery", title: "Машинная вышивка", text: "Это популярный способ переноса изображения на одежду и аксессуары: сумки и кепки, спортивную форму и майки, толстовки и куртки. Владельцы гостиниц и отелей также любят украшать вышивкой пледы, полотенца и халаты.", term: "Срок изготовления 5–\u20607\u00a0дней", run: "Тираж от 500 до\u00a05\u00a0000\u00a0шт.", href: "/application-types/embroidery", image: "/images/applications/embroidery.webp" },
    { id: "decal", title: "Деколь", text: "Для нанесения изображений на посуду, особенно из керамики, фарфора и стекла чаще всего используют деколь, несмотря на трудоёмкость этого процесса. Эта технология востребована не только при изготовлении промо-продукции, но и в промышленности.", term: "Срок изготовления 2–\u20607\u00a0дней", run: "Тираж от 500 до\u00a05\u00a0000\u00a0шт.", href: "/application-types/decal", image: "/images/applications/decal.webp" },
    { id: "digital-press", title: "Цифровая печать", text: "C помощью цифровой печати брендируют пластик и бумагу, а затем используют эти полиграфические вставки для украшения бейджей, часов и прочей продукции. Также можно нанести изображение на одежду, для этого используют трансферную бумагу.", term: "Срок изготовления 2–\u20607\u00a0дней", run: "Тираж от 500 до\u00a05\u00a0000\u00a0шт.", href: "/application-types/digital-press", image: "/images/applications/digital-press.webp" },
    { id: "thermal-transfer", title: "Термоперенос", text: "Главная особенность флекс-нанесения - это многообразие используемых техник и возможность печати на любых участках изделия. Чаще всего термоперенос флекс плёнкой используют для нанесения изображения на текстильные изделия.", term: "Срок изготовления 2–\u20607\u00a0дней", run: "Тираж от 500 до\u00a05\u00a0000\u00a0шт.", href: "/application-types/thermal-transfer", image: "/images/applications/thermal-transfer.webp" },
    { id: "laser-engraving", title: "Лазерная гравировка", text: "Это идеальный вариант если для вас важнее всего стойкость изображения, наносимого на продукцию из твёрдого материала (металла, дерева, кожи, стекла). Изображение можно нанести почти на любой предмет: от призового кубка до простого карандаша.", term: "Срок изготовления 2–\u20607\u00a0дней", run: "Тираж от 10 до\u00a010\u00a0000\u00a0шт.", href: "/application-types/laser-engraving", image: "/images/applications/laser-engraving.webp" },
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

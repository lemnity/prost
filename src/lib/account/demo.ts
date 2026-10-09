import type { CartItem } from "@/lib/cart/store";
import type { Profile, SavedOrder } from "./store";

export const DEMO = { email: "demo@prostyle.gifts", password: "demo2026" };

const C = "https://prostyle.gifts/content/catalog/covers/";
const P = {
  star: { id: "29610924", sku: "23318.20", title: "Подвеска «Звезда», 3D-печать, оранжевая", image: `${C}96D05A67CC49AB241298480308E45913.webp`, url: "/catalog/promo/promo-plastikovye-brelki/item-podveska-zvezda-3d-pechat-oranzhevaya-2331820", price: 140, oldPrice: 175 },
  pen: { id: "29796969", sku: "19670.30", title: "Ручка шариковая Carton Plus, ver.2, черная", image: `${C}C94201E11ACF5C1B931C5A0B3E927FED.webp`, url: "/catalog/ruchki/ruchki-derevyannye/item-ruchka-sharikovaya-carton-plus-ver2-chernaya-1967030", price: 24 },
  tippo: { id: "29796968", sku: "20566.90", title: "Ручка шариковая Tippo, зеленая", image: `${C}E9C6764CD3ECB29876BCECB086BDF6BD.webp`, url: "/catalog/ruchki/ruchki-plastikovye/item-ruchka-sharikovaya-tippo-zelenaya-2056690", price: 26, oldPrice: 33 },
  ball: { id: "29798885", sku: "20399.01", title: "Антистресс «Теннисный мяч»", image: `${C}BC7D63ADC2A11AB87569114539AE1913.webp`, url: "/catalog/promo/promo-antistressy/item-antistress-tennisnyj-myach-2039901", price: 130 },
  box: { id: "29799421", sku: "26020.60", title: "Коробка «Домик», M, белая", image: `${C}C3F8FE93069894D1B1B07D6AB661755A.webp`, url: "/catalog/novyy-god/upakovka-dlya-novogodnih-podarkov/item-korobka-domik-m-belaya-2602060", price: 132 },
  mug: { id: "kruzhka-keramicheskaya-300ml-mo8040-06", sku: "MO8040-06", title: "Кружка керамическая 300ml (белый)", image: `${C}2E974B71126A681A98C65A66E6110AFD.webp`, url: "/catalog/posuda/posuda-krujki/item-kruzhka-keramicheskaya-300ml-mo8040-06", price: 590.7 },
  tee: { id: "futbolka-detskaya-regent-kids-150-belyj-71197010204a", sku: "711970.102/04A", title: "Футболка детская REGENT KIDS 150 (белый)", image: `${C}B7EEA9919ED9FB0C2175E9298ABAA99B.webp`, url: "/catalog/detyam/detskaya-odejda/item-futbolka-detskaya-regent-kids-150-belyj-71197010204a", price: 350 },
};

const line = (p: (typeof P)[keyof typeof P], qty: number, extra: Partial<CartItem> = {}): CartItem => ({ ...p, qty, ...extra });
const sum = (items: CartItem[]) => Math.round(items.reduce((s, i) => s + i.qty * i.price, 0) * 100) / 100;

function order(number: string, daysAgo: number, now: number, items: CartItem[], rest: Partial<SavedOrder> = {}): SavedOrder {
  return {
    number,
    date: new Date(now - daysAgo * 86_400_000).toISOString(),
    total: sum(items),
    items,
    delivery: "Курьером по Тюмени",
    payment: "Безналичный расчёт",
    address: "ул. Республики, 14, офис 305, пропуск на ресепшн",
    status: "new",
    ...rest,
  };
}

export const DEMO_FAVORITES = [P.star, P.mug, P.ball];

export function demoProfile(now: number): Profile {
  return {
    lastName: "Смирнова",
    name: "Анна",
    middleName: "Викторовна",
    email: DEMO.email,
    phone: "+7 (912) 345-67-89",
    company: "ООО «Демо Компания»",
    inn: "7203000000",
    city: "Тюмень",
    address: "ул. Республики, 14, офис 305",
    marketing: true,
    marketingAt: new Date(now - 120 * 86_400_000).toISOString(),
    delivery: {
      method: "courier",
      defaultId: "office",
      addresses: [
        { id: "office", label: "Офис", city: "Тюмень", address: "ул. Республики, 14, офис 305", recipient: "Смирнова Анна", phone: "+7 (912) 345-67-89", comment: "Пропуск на ресепшн" },
        { id: "branch", label: "Филиал", city: "Екатеринбург", address: "ул. Малышева, 51", recipient: "Иванов Пётр", phone: "+7 (922) 111-22-33", comment: "" },
      ],
    },
  };
}

/** Заявки демо-кабинета: 2 текущие и 3 в истории. Номера — с префиксом PS-DEMO. */
export function demoOrders(now: number): SavedOrder[] {
  return [
    order("PS-DEMO-0001", 1, now, [line(P.star, 50), line(P.pen, 200, { preorder: true }), line(P.mug, 10)]),
    order("PS-DEMO-0002", 4, now, [line(P.tee, 40)], { delivery: "Самовывоз из офиса", address: undefined }),
    order("PS-DEMO-0003", 21, now, [line(P.tippo, 500), line(P.ball, 60)], { status: "done" }),
    order("PS-DEMO-0004", 34, now, [line(P.box, 100)], { status: "cancelled", delivery: "В регионы России", address: "Екатеринбург, ул. Малышева, 51" }),
    order("PS-DEMO-0005", 95, now, [line(P.mug, 30), line(P.pen, 300)], { payment: "Банковской картой" }),
  ];
}

/** Переписка по первой заявке после приветствия и разбора корзины. */
export const DEMO_DIALOG = [
  { role: "user" as const, text: "Нужно к 25 числу, нанесение — логотип на ручках и кружках.", offset: 60_000 },
  {
    role: "manager" as const,
    text: "Отлично, успеваем к 25 числу. Для ручек предложу тампопечать, для кружек — деколь. Пришлите логотип в векторе прямо сюда в чат — подготовлю расчёт и макеты.",
    offset: 75_000,
  },
];

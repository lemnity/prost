import { site } from "./site";

export const company = {
  name: "Про стиль",
  brand: "ProStyle",
  quote:
    "Промопродукция и бизнес-подарки - это страсть, которая увлекает нас уже более 15 лет. В каждом сувенире мы передаем частичку нашей любви и внимания.",
  yearsOnMarket: 15,
  minOrder: "10 000 ₽",
} as const;

export type Requisite = { label: string; value: string | null };

// TODO: заполнить реквизиты (null отображается как «—»)
export const requisites: Requisite[] = [
  { label: "Наименование компании", value: company.name },
  { label: "ИНН", value: null },
  { label: "КПП", value: null },
  { label: "ОГРН", value: null },
  { label: "Юридический адрес", value: null },
  { label: "Почтовый адрес", value: null },
  { label: "Р/счёт", value: null },
  { label: "Банк", value: null },
  { label: "БИК", value: null },
  { label: "Корр. счёт", value: null },
  { label: "Телефон", value: site.phone.label },
  { label: "Эл. почта", value: site.email },
  { label: "Директор", value: null },
];

export type CityId = "tyumen" | "moscow" | "ekaterinburg";

export type Office = {
  id: CityId;
  city: string;
  soon?: boolean;
  address?: string;
  hours?: string;
  phone?: { label: string; href: string };
  email?: string;
  /** "lon,lat" — геокодировано один раз (OSM). */
  point?: string;
};

export const offices: Office[] = [
  {
    id: "tyumen",
    city: "Тюмень",
    address: site.address,
    hours: site.hours,
    phone: site.phone,
    email: site.email,
    point: "65.535297,57.128887",
  },
  {
    id: "moscow",
    city: "Москва",
    address: "Москва, Волховский переулок, 21/23, пом. 1, к. 5",
    hours: "Пн–пт с 08:00 до 18:00",
    phone: { label: "+7 (495) 374-88-44", href: "tel:+74953748844" },
    email: "info@moscowsuvenir.ru",
    point: "37.685479,55.770363",
  },
  { id: "ekaterinburg", city: "Екатеринбург", soon: true },
];

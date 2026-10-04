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

import type { Address, DeliveryPrefs, Profile } from "@/lib/account/store";
import { str } from "./http";

const PHONE = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Профиль из запроса: только известные поля, обрезанные строки. Ошибка — текст для поля. */
export function cleanProfile(src: Record<string, unknown>, email: string): { profile: Profile } | { field: string; error: string } {
  const p: Profile = {
    name: str(src.name, 80),
    lastName: str(src.lastName, 80),
    middleName: str(src.middleName, 80),
    email,
    phone: str(src.phone, 32),
    company: str(src.company, 200),
    inn: str(src.inn, 12).replace(/\D/g, ""),
    city: str(src.city, 120),
    address: str(src.address, 300),
    marketing: src.marketing === true,
  };
  if (!p.name) return { field: "name", error: "Укажите имя" };
  if (p.phone && !PHONE.test(p.phone)) return { field: "phone", error: "Введите номер полностью" };
  if (p.inn && !/^(\d{10}|\d{12})$/.test(p.inn)) return { field: "inn", error: "ИНН состоит из 10 или 12 цифр" };
  return { profile: p };
}

export function cleanDelivery(src: unknown): DeliveryPrefs | null {
  if (!src || typeof src !== "object") return null;
  const d = src as Record<string, unknown>;
  const method = d.method === "courier" || d.method === "region" ? d.method : "pickup";
  const addresses: Address[] = (Array.isArray(d.addresses) ? d.addresses : []).slice(0, 20).map((a: Record<string, unknown>) => ({
    id: str(a.id, 40) || Math.random().toString(36).slice(2, 10),
    label: str(a.label, 60),
    city: str(a.city, 120),
    address: str(a.address, 300),
    recipient: str(a.recipient, 120),
    phone: str(a.phone, 32),
    comment: str(a.comment, 300),
  }));
  const defaultId = typeof d.defaultId === "string" && addresses.some((a) => a.id === d.defaultId) ? d.defaultId : addresses[0]?.id ?? null;
  return { method, addresses, defaultId };
}

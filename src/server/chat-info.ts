import { greetName } from "@/lib/account/store";
import type { ChatInfo } from "@/lib/chat/types";
import type { DbUser } from "./auth";
import { toAdmin, type OrderRow } from "./orders";

export function toChatInfo(r: OrderRow, user: DbUser | null): ChatInfo {
  const o = toAdmin(r);
  return {
    number: o.number,
    name: user && user.role !== "admin" ? greetName(user.profile) : o.contact.name.split(/\s+/)[0] ?? "",
    createdAt: Date.parse(o.date),
    total: o.total,
    items: o.items,
    orderText: o.orderText,
    status: o.status ?? "new",
  };
}

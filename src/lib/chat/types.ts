import type { CartItem } from "@/lib/cart/store";

export type ChatFileMeta = { id: string; name: string; size: number; type: string };

/** Сообщение чата. at — момент, с которого видно; до typeAt менеджер «читает», затем «печатает…». */
export type ChatMessage = {
  id: number;
  role: "agent" | "user" | "manager";
  text: string;
  at: number;
  typeAt?: number;
  files?: ChatFileMeta[];
};

export type ChatInfo = {
  number: string;
  name: string;
  createdAt: number;
  total: number;
  items: CartItem[];
  orderText: string;
  status: string;
};

export const MAX_FILES = 10;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const ACCEPT =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.csv,.ai,.eps,.cdr,.psd,.svg,.tif,.tiff,.zip,.rar,.7z";

export const isImage = (f: Pick<ChatFileMeta, "type" | "name">) =>
  f.type.startsWith("image/") && !/\.(psd|tiff?|eps|ai)$/i.test(f.name);

export function formatSize(n: number): string {
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} КБ`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} МБ`;
}

export const extOf = (name: string) => (name.includes(".") ? name.split(".").pop()!.toUpperCase().slice(0, 4) : "ФАЙЛ");

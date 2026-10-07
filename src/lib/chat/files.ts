/** Вложения чата хранятся в IndexedDB (localStorage для файлов слишком мал). */

export type ChatFile = { id: string; name: string; size: number; type: string };

export const MAX_FILES = 10;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const ACCEPT =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.csv,.ai,.eps,.cdr,.psd,.svg,.tif,.tiff,.zip,.rar,.7z";

const DB = "prostyle-chat-files";
const STORE = "files";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let seq = 0;

/** Сохраняет файлы и возвращает их описание для сообщения. */
export async function saveFiles(files: File[]): Promise<ChatFile[]> {
  const out: ChatFile[] = [];
  for (const f of files) {
    const id = `f${Date.now().toString(36)}${(seq++).toString(36)}`;
    await tx("readwrite", (s) => s.put(f, id));
    out.push({ id, name: f.name || "файл", size: f.size, type: f.type });
  }
  return out;
}

export async function loadFile(id: string): Promise<Blob | null> {
  try {
    return ((await tx("readonly", (s) => s.get(id))) as Blob | undefined) ?? null;
  } catch {
    return null;
  }
}

export const isImage = (f: Pick<ChatFile, "type" | "name">) =>
  f.type.startsWith("image/") && !/\.(psd|tiff?|eps|ai)$/i.test(f.name);

export function formatSize(n: number): string {
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} КБ`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} МБ`;
}

export const extOf = (name: string) => (name.includes(".") ? name.split(".").pop()!.toUpperCase().slice(0, 4) : "ФАЙЛ");

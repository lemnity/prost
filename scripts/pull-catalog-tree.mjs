// Обновляет снимок дерева каталога: node scripts/pull-catalog-tree.mjs [https://prostyle.agency]
import { writeFileSync } from "node:fs";
const base = process.argv[2] || "https://prostyle.agency";
const res = await fetch(`${base}/api/catalog/tree`);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
writeFileSync(new URL("../src/data/oasis-tree.json", import.meta.url), JSON.stringify(data));
console.log(`Сохранено разделов: ${data.categories.length}`);

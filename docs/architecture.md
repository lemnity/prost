# Архитектура

## Стек

| Слой | Технология |
|---|---|
| Фреймворк | **Next.js 16.3** (App Router, `output: "standalone"`), React 19.2, TypeScript |
| Стили | Tailwind CSS v4 (токены в `src/app/globals.css`); Material UI v9 подключён (слой `@layer mui` ниже utilities), пока не используется |
| База | MySQL 8 (`mysql2/promise`, пул из `DATABASE_URL`, `utf8mb4_unicode_ci`) |
| Почта | nodemailer → локальный Postfix `127.0.0.1:25` + OpenDKIM (селектор `mail`) |
| ИИ | RouterAI (OpenAI-совместимый API, `https://routerai.ru/api/v1`), модель `openai/gpt-6-luna` |
| Погода | Open-Meteo (без ключа) |
| Сервер | Ubuntu 24.04 (VPS FirstVDS, 82.146.52.154), nginx → node `127.0.0.1:3010`, systemd |

> **Важно:** это Next 16 — API отличаются от старых версий. Перед кодом читать `node_modules/next/dist/docs/` (см. `AGENTS.md`).

## Структура кода

```
src/
  app/                    маршруты (страницы и API)
    api/                  route handlers
      admin/              заявки, обращения, пользователи, склад (+ stock/run — фоновый запуск)
      ai/                 окно поиска с Викторией
      auth/ me/ orders/ chat/ chats/ files/ leads/
      catalog/tree        дерево разделов с количеством (источник снимка)
      catalog/list        догрузка «Показать ещё»
      internal/oasis-sync синхронизация складов для таймеров (X-Sync-Token)
      internal/revalidate обновление статических страниц после выкладки
    catalog/[category]/[sub]/[item]   разделы, подборки, товары
    sitemap.xml/  sitemaps/[name]/    карта сайта (индекс и части)
    robots.ts  sitemap/ (HTML-карта)
  components/             UI по областям (catalog, layout, account, admin, home, …)
  lib/                    изоморфная логика (дерево каталога, фасеты, корзина, чат, форматирование)
  server/                 только сервер: БД, склады, авторизация, письма, ИИ
  content/                тексты и справочники (site, delivery, home, legal, news)
  data/oasis-tree.json    снимок дерева разделов (коммитится)
scripts/                  deploy.sh, create-admin.mjs, pull-catalog-tree.mjs
deploy/server/            копии конфигов сервера: systemd, nginx, cron, скрипты синхронизации (см. README там)
.env.example              список переменных окружения сервера (без значений)
docs/                     документация (этот каталог), макеты в docs/design
```

## Данные (MySQL)

Таблицы создаются и мигрируют сами при первом запросе: `src/server/db.ts` (`SCHEMA` + `ALTERS` + разовые переносы).

| Таблица | Назначение |
|---|---|
| `users`, `sessions`, `email_tokens` | аккаунты (scrypt), сессии (sha256 токена в cookie `ps_session`), подтверждение почты |
| `orders`, `messages`, `files`, `leads` | заявки, чат заявки, вложения, обращения с форм |
| `oc_categories` | единое дерево разделов (из Oasis: Продукция 2891, Праздники 2269, ВИП 1906) |
| `oc_products` | **узкая** таблица выдачи: цена, остатки, цвет, обложка, основной раздел, поставщик (`supplier`: oasis / gifts) |
| `oc_product_details` | тяжёлые поля: описание, характеристики, фото (читаются только на карточке) |
| `oc_product_categories` | товар ↔ раздел (с предками) |
| `oc_product_facets` | метки фильтров: `c` цвет, `m` материал, `p` нанесение |
| `category_map` | раздел поставщика → наш раздел (`auto=1` — по умолчанию из кода, `0` — вручную) |
| `sync_log` | журнал синхронизаций (видно в админке) |
| `site_banners`, `site_news`, `site_topics` | баннеры главной, новости и темы новостей (разделы-фильтры на `/news`) (админка → «Сайт»); удаление мягкое (`deleted_at`). Наполняются из `src/content/home.ts` и `news.json` через `INSERT IGNORE`; без базы сайт показывает эти файлы |

### Идентификаторы товаров

- Oasis — числовые id; в адресе дефис заменяется на `x`.
- gifts.ru — `g<product_id>`.
- `group_id` — цвет (размеры внутри), `color_group_id` — модель (все цвета). Выдача показывает одну карточку на модель (`ROW_NUMBER() OVER (PARTITION BY COALESCE(color_group_id, id))`).

### Адрес товара

`/catalog/<раздел>/<подраздел>/item-<слаг>-<id>`. Если основной раздел сменился, срабатывает постоянная переадресация на канонический адрес. Старые адреса сайта переадресуются по артикулу или названию раздела (`legacyRedirect`).

## Склады

| | Oasis | gifts.ru (Проект 111) |
|---|---|---|
| Доступ | `OASIS_API_KEY` | `GIFTS_LOGIN` / `GIFTS_PASSWORD`, IP сервера в белом списке |
| Каталог целиком | `api.oasiscatalog.com/v4/products` постранично по 500 | `product.xml` (~100 МБ) потоковым разбором (`sax`) |
| Цены и остатки | один запрос лёгких полей → временная таблица → UPDATE | `stock.xml` |
| Раздел вручную | `products?category=<id>` (с подразделами) | нет (выгрузка только целиком) |
| Разделы | свои (основа дерева) | `tree.xml` → `category_map` (умолчания в `src/server/gifts-map.ts`) |
| Фото | URL из API | публично `files.gifts.ru/reviewer/…` |
| Код | `src/server/oasis.ts` | `src/server/gifts.ts` |

После загрузки каталога пересчитываются количества по разделам (модели, не строки) и метки фильтров (`src/server/facets.ts`).

Большие загрузки (каталоги, разделы) идут **по очереди** (`heavy()` в `oasis.ts`), иначе блокируют друг друга. Блокировки MySQL (1213/1205) повторяются автоматически (`exec` в `db.ts`).

### Расписание (systemd-таймеры на сервере)

| Таймер | Когда | Что |
|---|---|---|
| `prostyle-oasis-sync` | каждый час | цены и остатки Oasis |
| `prostyle-gifts-sync` | каждый час в :20 | цены и остатки gifts.ru |
| `prostyle-oasis-catalog` | 03:30 | каталог Oasis целиком |
| `prostyle-gifts-catalog` | 04:30 | каталог gifts.ru целиком |

Таймеры вызывают `POST /api/internal/oasis-sync[?supplier=gifts][&kind=catalog]` с заголовком `X-Sync-Token`. Админка запускает те же задачи в фоне через `/api/admin/stock/run`: nginx ждёт ответа всего 60 с.

## Снимок дерева разделов

`src/data/oasis-tree.json` — дерево с количеством и обложками. Статические части (меню, главная, карта разделов) собираются без базы. Обновление: `node scripts/pull-catalog-tree.mjs http://localhost:3000` (dev-сервер, подключённый к боевой базе), затем коммит. Версия снимка (`TREE_VERSION`) добавляется к адресу `/catalog-menu.json`, чтобы браузеры не держали старое меню.

## Кэширование

- **Выдача и счётчики фильтров:** кэш в памяти на 10 минут (`listProducts`, `listFacets` в `src/server/catalog.ts`).
- **Распродажа недели:** кэш на неделю (ключ — дата конца недели).
- **Товар дня:** кэш на сутки.
- **Карта сайта:** кэш на 6 часов.
- **Фото товаров → WebP:** `next/image` с загрузчиком `src/lib/image-loader.ts` отдаёт фото складов через `/api/img?w=&src=` (sharp, ширины из `src/lib/image-widths.ts`). Готовые WebP кэширует nginx (`/var/cache/nginx/imgs`, до 2 ГБ), каждое фото конвертируется один раз. На сервере Linux-сборка sharp лежит в `/opt/prostyle/node_modules` (вне релизов: сборка идёт на Mac).
- **Кэш страниц Next (ISR) — только в памяти:** `experimental.isrFlushToDisk: false`. Роботы обходят десятки тысяч товаров, и кэш на диске однажды занял весь диск.
- **Главная и `/sale`** собираются при каждом запросе (`force-dynamic`). При сборке базы нет, и заготовка со сборки показывала бы запасные данные.

## ИИ (Виктория)

- **Общее** (`src/server/persona.ts`): `KNOWLEDGE` (компания, доставка, оплата, виды нанесения), `STYLE` (манера, правила).
- **Окно поиска:** `src/server/ai.ts` → `/api/ai`. Модель отвечает JSON `{text, picks, more_text, more, question}`, а сервер раскладывает его на сообщения с карточками.
- **Чат заявки:** `src/server/victoria.ts`. Контекст — заявка клиента и последние 24 сообщения. Ответ готовится в `after()` и записывается с паузами «прочитала / печатает». Если менеджер писал в последние 30 минут, Виктория молчит.
- **Инструменты модели:** `search_catalog` (поиск по каталогу), `get_weather` (`src/server/weather.ts`).
- **Без ключа** работает обычный поиск по каталогу (окно) и ответы по правилам (чат).

## Авторизация и безопасность

- **Пароли** — scrypt; **сессии** — httpOnly cookie, в базе хранится sha256 токена.
- **Защита изменяющих запросов:** проверка `Origin` (`sameOrigin`) + SameSite=Lax.
- **Ограничения частоты запросов** — в памяти: вход, чат, ИИ.
- **Права:** роли `user` и `admin`. API админки — `requireAdmin()`. Служебные вызовы — по токену `OASIS_SYNC_TOKEN`.

## Выкладка

- **`scripts/deploy.sh`:**
  1. локальная сборка в `.next-prod` (не мешает `next dev` в `.next`);
  2. rsync в `/opt/prostyle/releases/<время>`;
  3. переключение ссылки `/opt/prostyle/current`;
  4. `systemctl restart prostyle`;
  5. проверка здоровья;
  6. обновление главной.
- **Хранятся** 2 последних релиза.
- **nginx:**
  - отдаёт `/_next/static/` с диска;
  - http→https, www→без www;
  - `client_max_body_size 25m`.
- **Сертификат** — certbot (webroot).
- **Резервные копии:** `/etc/cron.daily/prostyle-backup` → `/var/backups/prostyle` (дамп базы и вложения, 14 дней).
- **Страховка диска:** `/etc/cron.hourly/prostyle-disk-guard` чистит кэш страниц при заполнении диска больше 90%.
- **Двоичные журналы MySQL отключены** (`disable_log_bin`): репликации нет.

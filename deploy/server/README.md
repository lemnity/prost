# Настройки сервера prostyle.agency

Копии конфигов с боевого сервера (Ubuntu 24.04), чтобы его можно было восстановить. Секретов здесь нет:
скрипты читают токены из `/opt/prostyle/.env` при запуске (образец — `.env.example` в корне репозитория).
Если что-то меняете на сервере — обновите копию здесь.

| Файл в репозитории | Путь на сервере | Что делает |
|---|---|---|
| `systemd/prostyle.service` | `/etc/systemd/system/` | сайт: `node server.js` из `/opt/prostyle/current`, порт 3010 |
| `systemd/prostyle-oasis-sync.{service,timer}` | `/etc/systemd/system/` | цены и остатки Oasis — каждый час |
| `systemd/prostyle-gifts-sync.{service,timer}` | `/etc/systemd/system/` | цены и остатки gifts.ru — каждый час в :20 |
| `systemd/prostyle-oasis-catalog.{service,timer}` | `/etc/systemd/system/` | каталог Oasis целиком — 03:30 |
| `systemd/prostyle-gifts-catalog.{service,timer}` | `/etc/systemd/system/` | каталог gifts.ru целиком — 04:30 |
| `bin/prostyle-*` | `/usr/local/bin/` | вызовы `POST /api/internal/oasis-sync` с токеном |
| `cron/prostyle-backup` | `/etc/cron.daily/` | дамп базы и вложений в `/var/backups/prostyle`, 14 дней |
| `cron/prostyle-disk-guard` | `/etc/cron.hourly/` | диск > 90% — чистит кэш страниц Next.js |
| `nginx/prostyle.agency.conf` | `/etc/nginx/sites-enabled/` | https, www → без www, статика `/_next/static/`, прокси на 3010 |

## Восстановление с нуля (кратко)

1. Пакеты: `nginx mysql-server postfix opendkim nodejs` (Node 24), certbot.
2. Пользователь `prostyle`, каталоги `/opt/prostyle/releases`, `/var/lib/prostyle/uploads`, `/var/backups/prostyle`.
3. База `prostyle` (utf8mb4_unicode_ci) и пользователь; в `/etc/mysql/mysql.conf.d/mysqld.cnf` — `disable_log_bin` (репликации нет).
4. `/opt/prostyle/.env` по образцу `.env.example`, права 600.
5. Скопировать файлы из этой папки по путям выше, `chmod +x` для `bin/*` и `cron/*`,
   `systemctl daemon-reload && systemctl enable --now prostyle prostyle-*.timer`.
6. Сертификат: certbot webroot `/var/www/letsencrypt`, затем `nginx -t && systemctl reload nginx`.
7. Выложить сайт с рабочей машины: `scripts/deploy.sh`. Таблицы базы создадутся при первом запросе.
8. Почта: SPF/DKIM/DMARC в DNS (reg.ru), PTR `82.146.52.154 → prostyle.agency` у хостинга.
9. Склады: IP сервера — в белом списке кабинета gifts.ru; первая загрузка каталогов — кнопками в админке «Склад».

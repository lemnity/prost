#!/usr/bin/env bash
# Деплой на prostyle.agency: сборка локально → rsync релиза → переключение ссылки → перезапуск службы.
# Использование: scripts/deploy.sh   (нужен ключ ~/.ssh/prostyle_deploy)
set -euo pipefail
HOST="${DEPLOY_HOST:-root@82.146.52.154}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/prostyle_deploy}"
SSH="ssh -i $KEY -o BatchMode=yes"
REL="$(date +%Y%m%d-%H%M%S)"
cd "$(dirname "$0")/.."
DIST=.next-prod
export NEXT_DIST_DIR="$DIST"

if [[ "${SKIP_BUILD:-}" != "1" ]]; then
  rm -rf "$DIST" out
  npm run build
fi
cp -r public "$DIST/standalone/"
mkdir -p "$DIST/standalone/$DIST" && rm -rf "$DIST/standalone/$DIST/static" && cp -r "$DIST/static" "$DIST/standalone/$DIST/static"

$SSH "$HOST" "mkdir -p /opt/prostyle/releases"
rsync -az --delete -e "$SSH" --link-dest=/opt/prostyle/current/ "$DIST/standalone/" "$HOST:/opt/prostyle/releases/$REL/"
$SSH "$HOST" bash -s "$REL" <<'REMOTE'
set -euo pipefail
REL="$1"
chown -R prostyle:prostyle "/opt/prostyle/releases/$REL"
ln -sfn "/opt/prostyle/releases/$REL" /opt/prostyle/current.new && mv -Tf /opt/prostyle/current.new /opt/prostyle/current
systemctl restart prostyle
for i in $(seq 1 30); do curl -fsS -o /dev/null http://127.0.0.1:3010/api/me && break; sleep 1; done
curl -fsS -o /dev/null http://127.0.0.1:3010/api/me && echo "релиз $REL запущен"
# Храним два последних релиза.
ls -1dt /opt/prostyle/releases/* | tail -n +3 | xargs -r rm -rf
REMOTE

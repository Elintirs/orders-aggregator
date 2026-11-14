#!/usr/bin/env bash
# Получение result.json по шагам из TASK.md: чистая БД -> POST /sync -> вебхуки -> daily-totals c_7.
# Запуск из корня проекта: bash scripts/make-result.sh (нужны Docker, Node 20+, npm install)
set -euo pipefail
PORT="${PORT:-3000}"

docker compose down -v
docker compose up -d
until docker compose exec -T postgres pg_isready -U postgres -d orders >/dev/null 2>&1; do sleep 1; done
sleep 2 # init-скрипт с тестовой БД отрабатывает после первого pg_isready
npm run migrate

PORT="$PORT" npx tsx src/server.ts > server.log 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
until curl -sf "localhost:$PORT/health" >/dev/null; do sleep 1; done

curl -sf -X POST "localhost:$PORT/sync"; echo
docker compose run --rm orders-api webhooks --target "http://host.docker.internal:$PORT/webhooks/order"
curl -sf "localhost:$PORT/customers/c_7/daily-totals?from=2026-03-27&to=2026-03-31" | node -e \
  'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>process.stdout.write(JSON.stringify(JSON.parse(s),null,2)+"\n"))' > result.json
cat result.json

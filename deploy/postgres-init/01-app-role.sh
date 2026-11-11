#!/bin/sh
# Выполняется один раз, при первом создании базы (docker-entrypoint-initdb.d).
#
# Сайт ходит в базу под отдельной ролью techstore_app: читать и менять строки можно,
# а удалять таблицы, менять схему и запускать команды на сервере базы — нельзя.
# Даже если в коде найдётся дыра, через неё не получится стереть базу целиком.
# Миграции применяет владелец базы (POSTGRES_USER) — см. MIGRATION_DATABASE_URL.
set -e

if [ -z "$APP_DB_PASSWORD" ]; then
  echo "APP_DB_PASSWORD не задан" >&2
  exit 1
fi

psql -v ON_ERROR_STOP=1 -v app_password="$APP_DB_PASSWORD" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'EOSQL'
CREATE ROLE techstore_app LOGIN PASSWORD :'app_password';
GRANT CONNECT ON DATABASE techstore TO techstore_app;
GRANT USAGE ON SCHEMA public TO techstore_app;
-- права на таблицы, которые миграции создадут позже
ALTER DEFAULT PRIVILEGES FOR ROLE techstore IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO techstore_app;
ALTER DEFAULT PRIVILEGES FOR ROLE techstore IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO techstore_app;
-- и на уже существующие, если скрипт запускают руками на готовой базе
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO techstore_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO techstore_app;
EOSQL

#!/bin/ash

if node dist/apps/api/main.js --check-data-permissions; then
  ./node_modules/.bin/prisma migrate deploy
fi

exec node dist/apps/api/main.js

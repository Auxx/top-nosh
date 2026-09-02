#!/bin/sh

npx -y prisma migrate deploy
node dist/apps/api/main.js

#!/bin/sh

npx -y prisma@7.10.0 migrate deploy
node dist/apps/api/main.js

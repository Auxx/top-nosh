# Stage 1: Build
# Runs on the native build platform: its output (dist + generated Prisma client, JS and WASM)
# is architecture-independent, and running `prisma generate` under QEMU emulation corrupts
# the schema WASM output on arm64 ("Unable to parse JSON [Context: getDmmf]").
FROM --platform=$BUILDPLATFORM node:26.13.1-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npx nx run-many --target=build --projects=api,web --configuration=production

# Stage 2: Production dependencies (native modules compiled here, tools stay behind)
FROM node:26.13.1-alpine AS prod-deps

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./

RUN npm ci --omit=dev

# Stage 3: Production Runtime
FROM node:26.13.1-alpine AS runner

WORKDIR /app

# No package managers in the final image: nothing can be downloaded or installed at runtime
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

COPY package.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./
COPY --chmod=755 docker/startup.sh ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data && chown node:node /app/data

ENV NODE_ENV=production
ENV SERVER_HTTP_PORT=3000
ENV SERVER_DEVELOPMENT_MODE=false
ENV PRISMA_DATABASE_URL=file:/app/data/top-nosh.db
ENV FILEMANAGEMENT_STORAGE_LOCAL=/app/data/storage
ENV CHECKPOINT_DISABLE=1
ENV PRISMA_HIDE_UPDATE_MESSAGE=1

EXPOSE 3000

USER node

CMD ["./startup.sh"]

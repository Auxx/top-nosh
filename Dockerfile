# Stage 1: Build
FROM node:24.20.0-bookworm-slim AS builder

WORKDIR /app

# Install build tools for native addons
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npx nx run-many --target=build --projects=api,web --configuration=production

# Stage 2: Production Runtime
FROM node:24.20.0-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./

RUN npm ci --omit=dev && npm cache clean --force
RUN npx -y prisma generate

COPY --from=builder /app/dist ./dist

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/apps/api/main.js"]

# Stage 1: Build
FROM node:24.20.0-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./

RUN npm ci

COPY . .

RUN npx prisma@7.10.0 generate
RUN npx nx run-many --target=build --projects=api,web --configuration=production

# Stage 2: Production Runtime
FROM node:24.20.0-alpine AS runner

WORKDIR /app

RUN apk add --no-cache python3 make g++

RUN mkdir ./data

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./
COPY docker/startup.sh ./

RUN chmod +x ./startup.sh
RUN npm ci --omit=dev
RUN npm cache clean --force
RUN npx -y prisma@7.10.0 generate

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV SERVER_HTTP_PORT=3000
ENV SERVER_DEVELOPMENT_MODE=false
ENV PRISMA_DATABASE_URL=file:/app/data/top-nosh.db

RUN ls -lA /app
RUN ls -lA /app/data

EXPOSE 3000

CMD ["./startup.sh"]

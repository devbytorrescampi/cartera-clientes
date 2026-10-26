# Se construye desde la raíz del monorepo: docker build -f apps/api/Dockerfile .
FROM node:24-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/api/prisma apps/api/prisma
RUN npm ci --workspace @tcshop/api --workspace @tcshop/shared --include-workspace-root

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @tcshop/shared && npm run build -w @tcshop/api

WORKDIR /app/apps/api
USER node
EXPOSE 3001
# Aplica las migraciones pendientes antes de arrancar.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

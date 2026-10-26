# Se construye desde la raíz del monorepo: docker build -f apps/web/Dockerfile .
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @tcshop/web --workspace @tcshop/shared --include-workspace-root --ignore-scripts

COPY packages/shared packages/shared
COPY apps/web apps/web
# Los rewrites de Next se resuelven al compilar: la URL de la API tiene que estar acá.
ARG API_URL=http://api:3001
ENV API_URL=$API_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @tcshop/shared && npm run build -w @tcshop/web

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node /app/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

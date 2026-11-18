# ---------- Etapa 1: construir el frontend ----------
FROM node:24-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---------- Etapa 2: la imagen final ----------
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./

# Solo traemos el resultado de la etapa 1 (la carpeta dist)
COPY --from=client-build /app/client/dist /app/client/dist

USER node
EXPOSE 3000
CMD ["sh", "-c", "node scripts/setup-db.js && exec node index.js"]
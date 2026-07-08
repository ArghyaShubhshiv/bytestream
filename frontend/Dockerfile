# frontend/Dockerfile
# ---- build stage ----
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# VITE_API_URL is baked into the bundle at build time. "/api" means the
# frontend talks to the same origin it's served from, and Caddy proxies
# /api/* to the backend — so there's no cross-origin (CORS) problem at all.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- serve stage ----
FROM caddy:2-alpine

COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
# backend/Dockerfile
FROM node:22-slim

WORKDIR /app

# Prisma needs openssl; curl is handy for healthchecks/debugging
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Install dependencies (devDeps included: we need the prisma CLI + tsx)
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the backend source
COPY . .

# Generate the Prisma client into ./generated/prisma
RUN npx prisma generate

EXPOSE 3001

# Apply committed migrations, then start the server.
# (Using tsx directly avoids a separate TS build step.)
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx index.ts"]
#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting ByteStream Initialization..."

# Ensure we're in the project root
cd "$(dirname "$0")"

echo "docker 1/4 -> Starting Docker containers (Postgres & Piston)..."
# We run docker-compose from the backend folder to preserve volume relatives
cd backend
docker-compose up -d
cd ..

echo "📦 2/4 -> Installing npm dependencies..."
# Uses the package.json script to install node_modules across root, backend, and frontend
npm run install:all

echo "🗄️ 3/4 -> Pushing Prisma database schema..."
cd backend
npx prisma db push
cd ..

echo "🌐 4/4 -> Booting Frontend & Backend servers concurrently..."
# Launch servers concurrently (frontend on port 5173, backend on 3001)
npm run dev

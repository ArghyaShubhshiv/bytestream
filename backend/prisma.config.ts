import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL must be set in production')
}
// Use a safer default for development
const defaultDbUrl = "postgresql://postgres:password@localhost:5432/bytestream?schema=public";
const finalUrl = databaseUrl || defaultDbUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: finalUrl,
  },
});

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Use the direct (unpooled) connection for migrations
  // In your .env, set DATABASE_URL_UNPOOLED to your Neon direct connection string
  datasource: {
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"]!,
  },
});

import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
const databaseUrl = env("DATABASE_URL");
const resolvedDatabaseUrl = databaseUrl.startsWith("file:")
  ? `file:${path.resolve(backendDirectory, "prisma", databaseUrl.slice("file:".length)).replace(/\\/g, "/")}`
  : databaseUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.js"
  },
  datasource: {
    url: resolvedDatabaseUrl
  }
});

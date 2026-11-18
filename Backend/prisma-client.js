const path = require("node:path");

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }
  const { PrismaClient } = require("@prisma/client");
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  const resolvedDatabaseUrl = databaseUrl.startsWith("file:")
    ? `file:${path.resolve(__dirname, "prisma", databaseUrl.slice("file:".length)).replace(/\\/g, "/")}`
    : databaseUrl;
  const adapter = new PrismaLibSql({ url: resolvedDatabaseUrl });
  return new PrismaClient({ adapter });
}

module.exports = { createPrismaClient };

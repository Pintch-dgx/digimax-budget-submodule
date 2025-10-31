import { PrismaClient } from "@prisma/client";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Assicurati che DATABASE_URL sia impostato per SQLite
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) {
  // Se DATABASE_URL è relativo o non impostato, usa il percorso assoluto
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === "file:./prisma/dev.db" || process.env.DATABASE_URL.includes("prisma/prisma")) {
    const projectRoot = process.cwd();
    const absoluteDbPath = path.join(projectRoot, "prisma", "dev.db");
    process.env.DATABASE_URL = `file:${absoluteDbPath}`;
    if (process.env.NODE_ENV === "development") {
      console.log("[db.ts] DATABASE_URL set to:", process.env.DATABASE_URL);
    }
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Log DATABASE_URL in development to verify correct path
if (process.env.NODE_ENV === "development" && !globalForPrisma.prisma) {
  console.log("[db.ts] Prisma client initialized with DATABASE_URL:", process.env.DATABASE_URL);
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

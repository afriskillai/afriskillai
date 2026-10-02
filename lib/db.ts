import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

/**
 * ============================================================================
 * AFRISKILL AI — PRISMA DATABASE CLIENT
 * ============================================================================
 *
 * Prisma ORM : 7.10.x
 * Base        : PostgreSQL
 *
 * Ce fichier doit être utilisé uniquement côté serveur.
 * ============================================================================
 */

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL est manquant. Ajoutez la connexion PostgreSQL dans les variables d'environnement.",
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

/**
 * En développement, Next.js recharge régulièrement
 * les modules.
 *
 * Sans singleton global, plusieurs PrismaClient
 * pourraient être créés inutilement.
 */
export const db =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;
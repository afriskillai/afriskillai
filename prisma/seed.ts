import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

/**
 * ============================================================================
 * AFRISKILL AI — DATABASE SEED
 * ============================================================================
 *
 * Prisma ORM : 7.10.x
 *
 * Ce seed est volontairement minimal.
 *
 * Il ne crée PAS :
 * - de faux clients ;
 * - de fausses commandes ;
 * - de faux paiements ;
 * - de faux revenus ;
 * - de faux accès aux formations.
 *
 * L'administrateur principal reste configuré via :
 * - ADMIN_EMAIL
 * - ADMIN_PASSWORD_HASH
 * - ADMIN_SESSION_SECRET
 *
 * ============================================================================
 */

config({
  path: ".env.local",
});

config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL est manquant. Configurez la connexion PostgreSQL avant d'exécuter le seed.",
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("");
  console.log("==============================================");
  console.log(" AFRISKILL AI — INITIALISATION DE LA BASE");
  console.log("==============================================");
  console.log("");

  /**
   * On vérifie simplement que la base est accessible.
   *
   * Aucun contenu commercial fictif n'est créé.
   */
  const [
    usersCount,
    coursesCount,
    ordersCount,
    paymentsCount,
    enrollmentsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.enrollment.count(),
  ]);

  console.log("Connexion PostgreSQL : OK");
  console.log("");
  console.log(`Clients             : ${usersCount}`);
  console.log(`Formations          : ${coursesCount}`);
  console.log(`Commandes           : ${ordersCount}`);
  console.log(`Paiements           : ${paymentsCount}`);
  console.log(`Accès formations    : ${enrollmentsCount}`);
  console.log("");

  console.log(
    "Aucune donnée commerciale fictive n'a été ajoutée.",
  );

  console.log("");
  console.log("==============================================");
  console.log(" AFRISKILL AI — SEED TERMINE");
  console.log("==============================================");
  console.log("");
}

main()
  .catch((error: unknown) => {
    console.error("");
    console.error(
      "Échec de l'initialisation AfriSkill AI.",
    );

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
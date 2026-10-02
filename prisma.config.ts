import "dotenv/config";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

/**
 * ============================================================================
 * AFRISKILL AI — CONFIGURATION PRISMA
 * ============================================================================
 *
 * Prisma ORM : 7.10.x
 * Database   : PostgreSQL
 *
 * Responsabilités :
 * - localisation du schéma Prisma ;
 * - localisation des migrations ;
 * - configuration du seed ;
 * - chargement sécurisé de DATABASE_URL ;
 * - configuration de la datasource utilisée par le CLI Prisma.
 *
 * IMPORTANT :
 * Les identifiants de base de données ne doivent jamais être écrits
 * directement dans ce fichier.
 * ============================================================================
 */

/**
 * Next.js utilise principalement `.env.local`.
 *
 * `dotenv/config` charge le fichier `.env` standard.
 * Cette ligne charge également `.env.local` afin que Prisma CLI
 * utilise la même DATABASE_URL que l'application Next.js.
 *
 * `override: false` évite d'écraser une variable DATABASE_URL
 * déjà fournie directement par l'environnement système ou
 * la plateforme d'hébergement.
 */
loadEnv({
  path: ".env.local",
  override: false,
});

const databaseUrl = process.env.DATABASE_URL;

/**
 * On échoue immédiatement avec un message clair lorsqu'une commande
 * nécessitant la configuration Prisma est exécutée sans DATABASE_URL.
 *
 * Cela évite notamment de lancer accidentellement une migration vers
 * une base indéterminée.
 */
if (!databaseUrl) {
  throw new Error(
    [
      "DATABASE_URL est manquant.",
      "Ajoutez une connexion PostgreSQL valide dans .env.local",
      "ou dans les variables d'environnement du serveur.",
    ].join(" "),
  );
}

export default defineConfig({
  /**
   * Schéma principal AfriSkill AI.
   */
  schema: "prisma/schema.prisma",

  /**
   * Prisma Migrate.
   */
  migrations: {
    path: "prisma/migrations",

    /**
     * Exécuté uniquement lorsque nous lançons :
     *
     * npx prisma db seed
     *
     * Prisma 7 ne lance plus automatiquement le seed
     * pendant migrate dev/reset.
     */
    seed: "tsx prisma/seed.ts",
  },

  /**
   * Connexion PostgreSQL.
   *
   * Le secret reste dans l'environnement et n'est jamais
   * enregistré dans le dépôt Git.
   */
  datasource: {
    url: databaseUrl,
  },
});
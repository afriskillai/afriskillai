import "server-only";

import {
  createHash,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";

import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);

const SCRYPT_KEY_LENGTH = 64;
const SALT_LENGTH = 16;

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 256;

export type AdminCredentials = {
  email: string;
  password: string;
};

export type AdminIdentity = {
  email: string;
  role: "admin";
};

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `[AfriSkill AI] La variable d'environnement ${name} est manquante.`,
    );
  }

  return value;
}

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  const normalized = normalizeAdminEmail(email);

  if (!normalized || normalized.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function validateAdminCredentialsInput(
  value: unknown,
): value is AdminCredentials {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AdminCredentials>;

  if (
    typeof candidate.email !== "string" ||
    typeof candidate.password !== "string"
  ) {
    return false;
  }

  const email = normalizeAdminEmail(candidate.email);

  if (!isValidEmailFormat(email)) {
    return false;
  }

  if (
    candidate.password.length === 0 ||
    candidate.password.length > MAX_PASSWORD_LENGTH
  ) {
    return false;
  }

  return true;
}

function safeStringCompare(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();

  return timingSafeEqual(leftDigest, rightDigest);
}

export async function hashAdminPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("Le mot de passe à hacher est vide.");
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error("Le mot de passe est trop long.");
  }

  const salt = randomBytes(SALT_LENGTH);

  const derivedKey = (await scrypt(
    password,
    salt,
    SCRYPT_KEY_LENGTH,
  )) as Buffer;

  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyAdminPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  try {
    if (
      !password ||
      password.length > MAX_PASSWORD_LENGTH ||
      !storedHash.startsWith("scrypt:")
    ) {
      return false;
    }

    const parts = storedHash.split(":");

    if (parts.length !== 3) {
      return false;
    }

    const [, saltHex, hashHex] = parts;

    if (!saltHex || !hashHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const storedKey = Buffer.from(hashHex, "hex");

    if (
      salt.length !== SALT_LENGTH ||
      storedKey.length !== SCRYPT_KEY_LENGTH
    ) {
      return false;
    }

    const derivedKey = (await scrypt(
      password,
      salt,
      storedKey.length,
    )) as Buffer;

    if (derivedKey.length !== storedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedKey);
  } catch {
    return false;
  }
}

export function getConfiguredAdminEmail(): string {
  return normalizeAdminEmail(
    getRequiredEnvironmentVariable("ADMIN_EMAIL"),
  );
}

export function getConfiguredAdminPasswordHash(): string {
  return getRequiredEnvironmentVariable("ADMIN_PASSWORD_HASH");
}

export async function authenticateAdmin(
  credentials: AdminCredentials,
): Promise<AdminIdentity | null> {
  const submittedEmail = normalizeAdminEmail(credentials.email);

  if (!isValidEmailFormat(submittedEmail)) {
    return null;
  }

  const configuredEmail = getConfiguredAdminEmail();
  const configuredPasswordHash = getConfiguredAdminPasswordHash();

  const emailMatches = safeStringCompare(
    submittedEmail,
    configuredEmail,
  );

  /*
   * On vérifie également le mot de passe lorsque l'e-mail est incorrect.
   * Cela réduit les différences de temps de réponse entre les deux cas.
   */
  const passwordMatches = await verifyAdminPassword(
    credentials.password,
    configuredPasswordHash,
  );

  if (!emailMatches || !passwordMatches) {
    return null;
  }

  return {
    email: configuredEmail,
    role: "admin",
  };
}
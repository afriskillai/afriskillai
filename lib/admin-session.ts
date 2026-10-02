import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE_NAME =
  "afriskill_admin_session";

const SESSION_VERSION = 1;

const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  version: number;
  email: string;
  role: "admin";
  issuedAt: number;
  expiresAt: number;
  sessionId: string;
};

export type AdminSession = {
  email: string;
  role: "admin";
  issuedAt: Date;
  expiresAt: Date;
  sessionId: string;
};

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "[AfriSkill AI] ADMIN_SESSION_SECRET est manquant.",
    );
  }

  if (secret.length < 32) {
    throw new Error(
      "[AfriSkill AI] ADMIN_SESSION_SECRET doit contenir au minimum 32 caractères.",
    );
  }

  return secret;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function safeCompare(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, "utf8");
    const rightBuffer = Buffer.from(right, "utf8");

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

function createSessionToken(payload: AdminSessionPayload): string {
  const encodedPayload = encodeBase64Url(
    JSON.stringify(payload),
  );

  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(
  token: string,
): AdminSessionPayload | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [encodedPayload, receivedSignature] = parts;

    if (!encodedPayload || !receivedSignature) {
      return null;
    }

    const expectedSignature = signPayload(encodedPayload);

    if (!safeCompare(receivedSignature, expectedSignature)) {
      return null;
    }

    const decoded = decodeBase64Url(encodedPayload);

    const payload = JSON.parse(decoded) as Partial<AdminSessionPayload>;

    if (
      payload.version !== SESSION_VERSION ||
      typeof payload.email !== "string" ||
      payload.role !== "admin" ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.expiresAt !== "number" ||
      typeof payload.sessionId !== "string"
    ) {
      return null;
    }

    const now = Date.now();

    if (
      payload.issuedAt > now + 60_000 ||
      payload.expiresAt <= now ||
      payload.expiresAt <= payload.issuedAt
    ) {
      return null;
    }

    return payload as AdminSessionPayload;
  } catch {
    return null;
  }
}

export async function createAdminSession(
  email: string,
): Promise<void> {
  const now = Date.now();

  const expiresAt =
    now + SESSION_DURATION_SECONDS * 1000;

  const payload: AdminSessionPayload = {
    version: SESSION_VERSION,
    email: email.trim().toLowerCase(),
    role: "admin",
    issuedAt: now,
    expiresAt,
    sessionId: randomBytes(24).toString("hex"),
  };

  const token = createSessionToken(payload);

  const cookieStore = await cookies();

  cookieStore.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: token,

    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: "lax",

    path: "/",

    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    ADMIN_SESSION_COOKIE_NAME,
  )?.value;

  if (!token) {
    return null;
  }

  const payload = verifySessionToken(token);

  if (!payload) {
    return null;
  }

  return {
    email: payload.email,
    role: payload.role,
    issuedAt: new Date(payload.issuedAt),
    expiresAt: new Date(payload.expiresAt),
    sessionId: payload.sessionId,
  };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("ADMIN_UNAUTHORIZED");
  }

  return session;
}

export async function deleteAdminSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function hasAdminSession(): Promise<boolean> {
  const session = await getAdminSession();

  return session !== null;
}
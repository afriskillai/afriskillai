import { NextRequest, NextResponse } from "next/server";

import {
  authenticateAdmin,
  normalizeAdminEmail,
  validateAdminCredentialsInput,
} from "@/lib/admin-auth";

import { createAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_AUTH_ERROR =
  "Adresse e-mail ou mot de passe incorrect.";

const INVALID_REQUEST_ERROR =
  "Veuillez renseigner une adresse e-mail et un mot de passe valides.";

const INTERNAL_ERROR =
  "Connexion temporairement indisponible. Veuillez réessayer.";

type LoginRequestBody = {
  email?: unknown;
  password?: unknown;
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    /*
     * On accepte uniquement du JSON.
     */
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse(
        {
          success: false,
          message: INVALID_REQUEST_ERROR,
        },
        415,
      );
    }

    let body: LoginRequestBody;

    try {
      body = (await request.json()) as LoginRequestBody;
    } catch {
      return jsonResponse(
        {
          success: false,
          message: INVALID_REQUEST_ERROR,
        },
        400,
      );
    }

    /*
     * Validation stricte avant toute authentification.
     */
    if (!validateAdminCredentialsInput(body)) {
      return jsonResponse(
        {
          success: false,
          message: INVALID_REQUEST_ERROR,
        },
        400,
      );
    }

    const credentials = {
      email: normalizeAdminEmail(body.email),
      password: body.password,
    };

    /*
     * Vérification exclusivement côté serveur.
     *
     * Aucun mot de passe, hash ou secret n'est envoyé au navigateur.
     */
    const admin = await authenticateAdmin(credentials);

    if (!admin) {
      /*
       * On ne précise volontairement pas si c'est l'e-mail
       * ou le mot de passe qui est incorrect.
       */
      return jsonResponse(
        {
          success: false,
          message: GENERIC_AUTH_ERROR,
        },
        401,
      );
    }

    /*
     * Création du cookie HttpOnly signé.
     */
    await createAdminSession(admin.email);

    return jsonResponse(
      {
        success: true,
        message: "Connexion réussie.",
        redirectTo: "/admin/dashboard",
      },
      200,
    );
  } catch (error) {
    /*
     * On journalise uniquement l'erreur serveur.
     * Les identifiants soumis ne sont jamais affichés ici.
     */
    console.error(
      "[AfriSkill AI] Échec de la connexion administrateur :",
      error instanceof Error ? error.message : "Erreur inconnue",
    );

    return jsonResponse(
      {
        success: false,
        message: INTERNAL_ERROR,
      },
      500,
    );
  }
}

/*
 * Empêche l'utilisation accidentelle de GET
 * pour transmettre des identifiants.
 */
export async function GET() {
  return jsonResponse(
    {
      success: false,
      message: "Méthode non autorisée.",
    },
    405,
  );
}
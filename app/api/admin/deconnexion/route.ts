import { NextResponse } from "next/server";

import { deleteAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonBody = Record<string, unknown>;

function jsonResponse(
  body: JsonBody,
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

export async function POST() {
  try {
    /*
     * La suppression de session reste volontairement
     * idempotente.
     *
     * Même si la session administrateur n'existe déjà
     * plus, la déconnexion est considérée comme réussie.
     */
    await deleteAdminSession();

    return jsonResponse(
      {
        success: true,
        message: "Déconnexion réussie.",
        redirectTo: "/admin/connexion",
      },
      200,
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erreur inconnue";

    console.error(
      "[AfriSkill AI] Échec de la déconnexion administrateur :",
      errorMessage,
    );

    /*
     * Aucune information sensible ou détail interne
     * de l'erreur n'est retourné au navigateur.
     */
    return jsonResponse(
      {
        success: false,
        message:
          "Impossible de terminer la déconnexion. Veuillez réessayer.",
      },
      500,
    );
  }
}

export async function GET() {
  return jsonResponse(
    {
      success: false,
      message: "Méthode non autorisée.",
    },
    405,
  );
}
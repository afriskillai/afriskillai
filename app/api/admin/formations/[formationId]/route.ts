import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { CourseStatus } from "@/generated/prisma/enums";

import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 150;

const MIN_SHORT_DESCRIPTION_LENGTH = 10;
const MAX_SHORT_DESCRIPTION_LENGTH = 300;

const MIN_DESCRIPTION_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 50_000;

const MAX_PRIVATE_ACCESS_URL_LENGTH = 2048;

const MAX_RICH_DOCUMENT_DEPTH = 20;
const MAX_RICH_DOCUMENT_NODES = 5_000;
const MAX_RICH_TEXT_LENGTH = 50_000;
const MAX_RICH_URL_LENGTH = 2_048;

const ALLOWED_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "horizontalRule",
  "image",
]);

const ALLOWED_MARK_TYPES = new Set([
  "bold",
  "italic",
  "strike",
  "code",
  "link",
]);

type RouteContext = {
  params: Promise<{
    formationId: string;
  }>;
};

type UpdateFormationBody = {
  title?: unknown;
  shortDescription?: unknown;
  description?: unknown;
  descriptionContent?: unknown;
  price?: unknown;
  promotionalPrice?: unknown;
  currency?: unknown;
  status?: unknown;
  privateAccessUrl?: unknown;
};

type RichNode = {
  type?: unknown;
  text?: unknown;
  attrs?: unknown;
  marks?: unknown;
  content?: unknown;
};

type RichMark = {
  type?: unknown;
  attrs?: unknown;
};

type ValidationResult =
  | {
      success: true;
      value: Record<string, unknown>;
    }
  | {
      success: false;
      message: string;
    };

/* =========================================================
   GET
   ========================================================= */

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Session administrateur requise.",
        },
        {
          status: 401,
        },
      );
    }

    const { formationId } = await context.params;
    const id = normalizeFormationId(formationId);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant de formation invalide.",
        },
        {
          status: 400,
        },
      );
    }

    const formation = await db.course.findUnique({
      where: {
        id,
      },

      include: {
        images: {
          orderBy: {
            position: "asc",
          },
        },

        descriptionImages: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!formation) {
      return NextResponse.json(
        {
          success: false,
          message: "Formation introuvable.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      formation,
    });
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_GET]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible de récupérer la formation.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   PUT
   ========================================================= */

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Session administrateur requise.",
        },
        {
          status: 401,
        },
      );
    }

    const { formationId } = await context.params;
    const id = normalizeFormationId(formationId);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant de formation invalide.",
        },
        {
          status: 400,
        },
      );
    }

    const existingFormation =
      await db.course.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          status: true,
          publishedAt: true,
        },
      });

    if (!existingFormation) {
      return NextResponse.json(
        {
          success: false,
          message: "Formation introuvable.",
        },
        {
          status: 404,
        },
      );
    }

    let body: UpdateFormationBody;

    try {
      body =
        (await request.json()) as UpdateFormationBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Le corps de la requête JSON est invalide.",
        },
        {
          status: 400,
        },
      );
    }

    const validation = validateUpdateBody(
      body,
      existingFormation.status,
      existingFormation.publishedAt,
    );

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.message,
        },
        {
          status: 400,
        },
      );
    }

    const data = validation.value;

    const formation = await db.course.update({
      where: {
        id,
      },

      data: {
        ...(data.title !== undefined
          ? {
              title: data.title as string,
            }
          : {}),

        ...(data.shortDescription !== undefined
          ? {
              shortDescription:
                data.shortDescription as string,
            }
          : {}),

        ...(data.description !== undefined
          ? {
              description:
                data.description as string,
            }
          : {}),

        ...(data.descriptionContent !== undefined
          ? {
              descriptionContent:
                data.descriptionContent === null
                  ? Prisma.JsonNull
                  : (data.descriptionContent as Prisma.InputJsonValue),
            }
          : {}),

        ...(data.price !== undefined
          ? {
              price: data.price as number,
            }
          : {}),

        ...(data.promotionalPrice !== undefined
          ? {
              promotionalPrice:
                data.promotionalPrice as
                  | number
                  | null,
            }
          : {}),

        ...(data.currency !== undefined
          ? {
              currency:
                data.currency as string,
            }
          : {}),

        ...(data.status !== undefined
          ? {
              status:
                data.status as CourseStatus,
            }
          : {}),

        ...(data.publishedAt !== undefined
          ? {
              publishedAt:
                data.publishedAt as Date | null,
            }
          : {}),

        ...(data.privateAccessUrl !== undefined
          ? {
              privateAccessUrl:
                data.privateAccessUrl as
                  | string
                  | null,
            }
          : {}),
      },

      include: {
        images: {
          orderBy: {
            position: "asc",
          },
        },

        descriptionImages: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,

      message:
        formation.status === CourseStatus.PUBLISHED
          ? "Formation enregistrée et publiée avec succès."
          : "Formation enregistrée avec succès.",

      formation,
    });
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_PUT]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible d’enregistrer la formation.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   DELETE
   ========================================================= */

/**
 * Suppression sécurisée d'une formation.
 *
 * Règles :
 *
 * 1. Une formation qui n'a jamais été réellement achetée
 *    peut être supprimée définitivement.
 *
 * 2. Les OrderItem appartenant à des commandes NON PAYÉES
 *    ne doivent pas empêcher la suppression d'une formation
 *    de test.
 *
 * 3. Les commandes et paiements ne sont jamais supprimés ici.
 *
 * 4. Une formation liée à une commande PAYÉE, un accès client
 *    ou toute autre donnée métier protégée n'est jamais détruite.
 *
 * 5. Si une contrainte métier protégée subsiste, la formation
 *    est archivée et retirée de la vente.
 *
 * Cette stratégie permet donc de supprimer les formations de test
 * sans détruire l'historique financier réel de la plateforme.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Session administrateur requise.",
        },
        {
          status: 401,
        },
      );
    }

    const { formationId } = await context.params;
    const id = normalizeFormationId(formationId);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant de formation invalide.",
        },
        {
          status: 400,
        },
      );
    }

    const formation = await db.course.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        title: true,
        status: true,

        orderItems: {
          select: {
            id: true,
            orderId: true,

            order: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!formation) {
      return NextResponse.json(
        {
          success: false,
          message: "Formation introuvable.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * ---------------------------------------------------------
     * PROTECTION DE L'HISTORIQUE PAYÉ
     * ---------------------------------------------------------
     *
     * Si au moins une ligne de commande de cette formation
     * appartient à une commande réellement payée, la formation
     * ne doit jamais être supprimée physiquement.
     */
    const hasPaidOrder = formation.orderItems.some(
      (item) => item.order.status === "PAID",
    );

    if (hasPaidOrder) {
      const archivedFormation = await db.course.update({
        where: {
          id,
        },

        data: {
          status: CourseStatus.ARCHIVED,
          publishedAt: null,
        },

        select: {
          id: true,
          title: true,
          status: true,
          publishedAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        action: "ARCHIVED",
        deleted: false,
        archived: true,

        message:
          "Cette formation possède un historique de commande payée. Elle a été retirée de la vente et archivée afin de conserver les données financières et les accès clients.",

        formation: archivedFormation,
      });
    }

    /*
     * ---------------------------------------------------------
     * SUPPRESSION DES RÉFÉRENCES DE TEST / NON PAYÉES
     * ---------------------------------------------------------
     *
     * On ne supprime PAS :
     *
     * - les commandes ;
     * - les paiements ;
     * - les utilisateurs.
     *
     * On détache uniquement cette formation des commandes qui
     * n'ont jamais été payées.
     *
     * Cela règle notamment :
     *
     * OrderItem_courseId_fkey
     *
     * qui empêchait la suppression de "formation 456".
     */
    await db.$transaction(
      async (tx) => {
        await tx.orderItem.deleteMany({
          where: {
            courseId: id,

            order: {
              status: {
                not: "PAID",
              },
            },
          },
        });

        /*
         * -----------------------------------------------------
         * TENTATIVE DE SUPPRESSION RÉELLE
         * -----------------------------------------------------
         *
         * Les relations configurées en cascade seront nettoyées
         * automatiquement par PostgreSQL.
         *
         * Si une relation protégée subsiste, Prisma déclenchera
         * P2003. Elle sera gérée juste après la transaction.
         */
        await tx.course.delete({
          where: {
            id,
          },
        });
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json({
      success: true,
      action: "DELETED",
      deleted: true,
      archived: false,

      message:
        "Formation supprimée définitivement avec succès.",

      formation: {
        id: formation.id,
        title: formation.title,
      },
    });
  } catch (error) {
    /*
     * ---------------------------------------------------------
     * FORMATION DÉJÀ SUPPRIMÉE
     * ---------------------------------------------------------
     *
     * Rend la suppression plus robuste lorsqu'une deuxième
     * requête DELETE arrive après une suppression réussie.
     */
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({
        success: true,
        action: "DELETED",
        deleted: true,
        archived: false,

        message:
          "La formation est déjà supprimée.",
      });
    }

    /*
     * ---------------------------------------------------------
     * CONTRAINTE MÉTIER PROTÉGÉE
     * ---------------------------------------------------------
     *
     * Une relation existe encore :
     *
     * - accès client ;
     * - inscription ;
     * - livraison ;
     * - commande payée ;
     * - ou autre historique protégé.
     *
     * Dans ce cas on ne force JAMAIS la suppression.
     */
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      try {
        const { formationId } = await context.params;
        const id = normalizeFormationId(formationId);

        if (!id) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Identifiant de formation invalide.",
            },
            {
              status: 400,
            },
          );
        }

        const existingFormation =
          await db.course.findUnique({
            where: {
              id,
            },

            select: {
              id: true,
              title: true,
            },
          });

        if (!existingFormation) {
          return NextResponse.json({
            success: true,
            action: "DELETED",
            deleted: true,
            archived: false,

            message:
              "La formation est déjà supprimée.",
          });
        }

        const archivedFormation =
          await db.course.update({
            where: {
              id,
            },

            data: {
              status: CourseStatus.ARCHIVED,
              publishedAt: null,
            },

            select: {
              id: true,
              title: true,
              status: true,
              publishedAt: true,
              updatedAt: true,
            },
          });

        return NextResponse.json({
          success: true,
          action: "ARCHIVED",
          deleted: false,
          archived: true,

          message:
            "Cette formation possède encore un historique métier protégé. Elle a été retirée de la vente et archivée afin de conserver les commandes, paiements et accès clients.",

          formation: archivedFormation,
        });
      } catch (archiveError) {
        console.error(
          "[ADMIN_FORMATION_DELETE_ARCHIVE]",
          archiveError,
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "La formation ne peut pas être supprimée et son archivage a également échoué.",
          },
          {
            status: 500,
          },
        );
      }
    }

    console.error(
      "[ADMIN_FORMATION_DELETE]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible de supprimer la formation.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   VALIDATION DE LA MISE À JOUR
   ========================================================= */

function validateUpdateBody(
  body: UpdateFormationBody,
  currentStatus: CourseStatus,
  currentPublishedAt: Date | null,
): ValidationResult {
  if (!isPlainObject(body)) {
    return invalid(
      "Les données de la formation sont invalides.",
    );
  }

  const data: Record<string, unknown> = {};

  /* ---------------------------------------------------------
     TITRE
     --------------------------------------------------------- */

  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      return invalid(
        "Le titre de la formation est invalide.",
      );
    }

    const title = body.title.trim();

    if (title.length < MIN_TITLE_LENGTH) {
      return invalid(
        `Le titre doit contenir au moins ${MIN_TITLE_LENGTH} caractères.`,
      );
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return invalid(
        `Le titre ne doit pas dépasser ${MAX_TITLE_LENGTH} caractères.`,
      );
    }

    data.title = title;
  }

  /* ---------------------------------------------------------
     DESCRIPTION COURTE
     --------------------------------------------------------- */

  if (body.shortDescription !== undefined) {
    if (
      typeof body.shortDescription !== "string"
    ) {
      return invalid(
        "La description courte est invalide.",
      );
    }

    const shortDescription =
      body.shortDescription.trim();

    if (
      shortDescription.length <
      MIN_SHORT_DESCRIPTION_LENGTH
    ) {
      return invalid(
        `La description courte doit contenir au moins ${MIN_SHORT_DESCRIPTION_LENGTH} caractères.`,
      );
    }

    if (
      shortDescription.length >
      MAX_SHORT_DESCRIPTION_LENGTH
    ) {
      return invalid(
        `La description courte ne doit pas dépasser ${MAX_SHORT_DESCRIPTION_LENGTH} caractères.`,
      );
    }

    data.shortDescription =
      shortDescription;
  }

  /* ---------------------------------------------------------
     DESCRIPTION TEXTE
     --------------------------------------------------------- */

  if (body.description !== undefined) {
    if (
      typeof body.description !== "string"
    ) {
      return invalid(
        "La description complète est invalide.",
      );
    }

    const description =
      body.description.trim();

    if (
      description.length <
      MIN_DESCRIPTION_LENGTH
    ) {
      return invalid(
        `La description complète doit contenir au moins ${MIN_DESCRIPTION_LENGTH} caractères.`,
      );
    }

    if (
      description.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      return invalid(
        `La description complète ne doit pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères.`,
      );
    }

    data.description = description;
  }

  /* ---------------------------------------------------------
     DESCRIPTION ENRICHIE TIPTAP
     --------------------------------------------------------- */

  if (
    body.descriptionContent !== undefined
  ) {
    if (
      body.descriptionContent === null
    ) {
      data.descriptionContent = null;
    } else {
      const richValidation =
        validateRichDocument(
          body.descriptionContent,
        );

      if (!richValidation.success) {
        return invalid(
          richValidation.message,
        );
      }

      data.descriptionContent =
        richValidation.value;
    }
  }

  /* ---------------------------------------------------------
     PRIX
     --------------------------------------------------------- */

  if (body.price !== undefined) {
    const price = parseMoneyValue(
      body.price,
    );

    if (price === null) {
      return invalid(
        "Le prix de la formation est invalide.",
      );
    }

    data.price = price;
  }

  /* ---------------------------------------------------------
     PRIX PROMOTIONNEL
     --------------------------------------------------------- */

  if (
    body.promotionalPrice !== undefined
  ) {
    if (
      body.promotionalPrice === null ||
      body.promotionalPrice === ""
    ) {
      data.promotionalPrice = null;
    } else {
      const promotionalPrice =
        parseMoneyValue(
          body.promotionalPrice,
        );

      if (promotionalPrice === null) {
        return invalid(
          "Le prix promotionnel est invalide.",
        );
      }

      data.promotionalPrice =
        promotionalPrice;
    }
  }

  /*
   * Validation croisée prix / promotion.
   *
   * Lorsqu'un seul des deux prix est modifié,
   * on ne possède pas ici l'autre valeur complète.
   * La validation principale est donc effectuée
   * sur les valeurs effectivement reçues.
   */
  if (
    data.price !== undefined &&
    data.promotionalPrice !== undefined &&
    data.promotionalPrice !== null
  ) {
    const price = data.price as number;
    const promotionalPrice =
      data.promotionalPrice as number;

    if (promotionalPrice >= price) {
      return invalid(
        "Le prix promotionnel doit être inférieur au prix normal.",
      );
    }
  }

  /* ---------------------------------------------------------
     DEVISE
     --------------------------------------------------------- */

  if (body.currency !== undefined) {
    if (
      typeof body.currency !== "string"
    ) {
      return invalid(
        "La devise est invalide.",
      );
    }

    const currency =
      body.currency
        .trim()
        .toUpperCase();

    if (
      !/^[A-Z]{3}$/.test(currency)
    ) {
      return invalid(
        "La devise doit être un code ISO à 3 lettres.",
      );
    }

    data.currency = currency;
  }

  /* ---------------------------------------------------------
     STATUT
     --------------------------------------------------------- */

  if (body.status !== undefined) {
    const status = parseCourseStatus(
      body.status,
    );

    if (!status) {
      return invalid(
        "Le statut de la formation est invalide.",
      );
    }

    data.status = status;

    if (
      status === CourseStatus.PUBLISHED
    ) {
      data.publishedAt =
        currentStatus ===
          CourseStatus.PUBLISHED &&
        currentPublishedAt
          ? currentPublishedAt
          : new Date();
    } else {
      data.publishedAt = null;
    }
  }

  /* ---------------------------------------------------------
     LIEN PRIVÉ
     --------------------------------------------------------- */

  if (
    body.privateAccessUrl !== undefined
  ) {
    if (
      body.privateAccessUrl === null ||
      body.privateAccessUrl === ""
    ) {
      data.privateAccessUrl = null;
    } else {
      if (
        typeof body.privateAccessUrl !==
        "string"
      ) {
        return invalid(
          "Le lien privé de la formation est invalide.",
        );
      }

      const privateAccessUrl =
        body.privateAccessUrl.trim();

      if (
        privateAccessUrl.length >
        MAX_PRIVATE_ACCESS_URL_LENGTH
      ) {
        return invalid(
          "Le lien privé de la formation est trop long.",
        );
      }

      if (
        !isAllowedPrivateUrl(
          privateAccessUrl,
        )
      ) {
        return invalid(
          "Le lien privé de la formation doit utiliser HTTPS.",
        );
      }

      data.privateAccessUrl =
        privateAccessUrl;
    }
  }

  if (
    Object.keys(data).length === 0
  ) {
    return invalid(
      "Aucune modification valide n’a été fournie.",
    );
  }

  return {
    success: true,
    value: data,
  };
}

/* =========================================================
   VALIDATION DOCUMENT TIPTAP
   ========================================================= */

function validateRichDocument(
  value: unknown,
):
  | {
      success: true;
      value: Record<string, unknown>;
    }
  | {
      success: false;
      message: string;
    } {
  if (!isPlainObject(value)) {
    return {
      success: false,
      message:
        "La description enrichie est invalide.",
    };
  }

  if (value.type !== "doc") {
    return {
      success: false,
      message:
        "La description enrichie doit être un document TipTap valide.",
    };
  }

  if (!Array.isArray(value.content)) {
    return {
      success: false,
      message:
        "Le contenu de la description enrichie est invalide.",
    };
  }

  const state = {
    nodes: 0,
    textLength: 0,
  };

  const result = validateRichNode(
    value,
    0,
    state,
  );

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    value,
  };
}

/* =========================================================
   VALIDATION NŒUD TIPTAP
   ========================================================= */

function validateRichNode(
  value: unknown,
  depth: number,
  state: {
    nodes: number;
    textLength: number;
  },
):
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    } {
  if (depth > MAX_RICH_DOCUMENT_DEPTH) {
    return {
      success: false,
      message:
        "La description enrichie contient trop de niveaux imbriqués.",
    };
  }

  if (!isPlainObject(value)) {
    return {
      success: false,
      message:
        "Un élément de la description enrichie est invalide.",
    };
  }

  state.nodes += 1;

  if (
    state.nodes >
    MAX_RICH_DOCUMENT_NODES
  ) {
    return {
      success: false,
      message:
        "La description enrichie contient trop d’éléments.",
    };
  }

  const node = value as RichNode;

  if (
    typeof node.type !== "string" ||
    !ALLOWED_NODE_TYPES.has(node.type)
  ) {
    return {
      success: false,
      message:
        "La description enrichie contient un type de contenu non autorisé.",
    };
  }

  /* ---------------------------------------------------------
     TEXTE
     --------------------------------------------------------- */

  if (node.type === "text") {
    if (typeof node.text !== "string") {
      return {
        success: false,
        message:
          "Un bloc de texte de la description est invalide.",
      };
    }

    state.textLength +=
      node.text.length;

    if (
      state.textLength >
      MAX_RICH_TEXT_LENGTH
    ) {
      return {
        success: false,
        message:
          "La description enrichie contient trop de texte.",
      };
    }
  } else if (
    node.text !== undefined
  ) {
    return {
      success: false,
      message:
        "La structure de la description enrichie est invalide.",
    };
  }

  /* ---------------------------------------------------------
     TITRE
     --------------------------------------------------------- */

  if (node.type === "heading") {
    if (!isPlainObject(node.attrs)) {
      return {
        success: false,
        message:
          "Un titre de la description enrichie est invalide.",
      };
    }

    const level =
      node.attrs.level;

    if (
      !Number.isInteger(level) ||
      typeof level !== "number" ||
      level < 1 ||
      level > 4
    ) {
      return {
        success: false,
        message:
          "Le niveau d’un titre de la description est invalide.",
      };
    }
  }

  /* ---------------------------------------------------------
     IMAGE
     --------------------------------------------------------- */

  if (node.type === "image") {
    const imageValidation =
      validateImageNode(node.attrs);

    if (!imageValidation.success) {
      return imageValidation;
    }
  }

  /* ---------------------------------------------------------
     MARKS
     --------------------------------------------------------- */

  if (node.marks !== undefined) {
    if (!Array.isArray(node.marks)) {
      return {
        success: false,
        message:
          "Le formatage d’un texte de la description est invalide.",
      };
    }

    for (const mark of node.marks) {
      const markValidation =
        validateRichMark(mark);

      if (!markValidation.success) {
        return markValidation;
      }
    }
  }

  /* ---------------------------------------------------------
     ENFANTS
     --------------------------------------------------------- */

  if (node.content !== undefined) {
    if (!Array.isArray(node.content)) {
      return {
        success: false,
        message:
          "La structure d’un bloc de la description est invalide.",
      };
    }

    for (const child of node.content) {
      const childValidation =
        validateRichNode(
          child,
          depth + 1,
          state,
        );

      if (!childValidation.success) {
        return childValidation;
      }
    }
  }

  return {
    success: true,
  };
}

/* =========================================================
   VALIDATION MARK TIPTAP
   ========================================================= */

function validateRichMark(
  value: unknown,
):
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    } {
  if (!isPlainObject(value)) {
    return {
      success: false,
      message:
        "Un formatage de texte est invalide.",
    };
  }

  const mark = value as RichMark;

  if (
    typeof mark.type !== "string" ||
    !ALLOWED_MARK_TYPES.has(mark.type)
  ) {
    return {
      success: false,
      message:
        "La description contient un formatage non autorisé.",
    };
  }

  if (mark.type === "link") {
    if (!isPlainObject(mark.attrs)) {
      return {
        success: false,
        message:
          "Un lien de la description est invalide.",
      };
    }

    const href =
      mark.attrs.href;

    if (
      typeof href !== "string" ||
      href.length === 0 ||
      href.length >
        MAX_RICH_URL_LENGTH ||
      !isHttpUrl(href)
    ) {
      return {
        success: false,
        message:
          "Un lien de la description est invalide.",
      };
    }
  }

  return {
    success: true,
  };
}

/* =========================================================
   VALIDATION IMAGE TIPTAP
   ========================================================= */

function validateImageNode(
  attrs: unknown,
):
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    } {
  if (!isPlainObject(attrs)) {
    return {
      success: false,
      message:
        "Une image de la description est invalide.",
    };
  }

  const src = attrs.src;

  if (
    typeof src !== "string" ||
    src.length === 0 ||
    src.length > MAX_RICH_URL_LENGTH ||
    !isHttpsUrl(src)
  ) {
    return {
      success: false,
      message:
        "Une image de la description possède une URL invalide.",
    };
  }

  if (
    attrs.imageId !== undefined &&
    attrs.imageId !== null &&
    (
      typeof attrs.imageId !== "string" ||
      attrs.imageId.trim().length === 0
    )
  ) {
    return {
      success: false,
      message:
        "L’identifiant d’une image de la description est invalide.",
    };
  }

  if (
    attrs.alt !== undefined &&
    attrs.alt !== null &&
    typeof attrs.alt !== "string"
  ) {
    return {
      success: false,
      message:
        "Le texte alternatif d’une image est invalide.",
    };
  }

  if (
    attrs.title !== undefined &&
    attrs.title !== null &&
    typeof attrs.title !== "string"
  ) {
    return {
      success: false,
      message:
        "La légende d’une image est invalide.",
    };
  }

  return {
    success: true,
  };
}

/* =========================================================
   STATUT
   ========================================================= */

function parseCourseStatus(
  value: unknown,
): CourseStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim().toUpperCase();

  if (
    normalized === CourseStatus.DRAFT
  ) {
    return CourseStatus.DRAFT;
  }

  if (
    normalized === CourseStatus.PUBLISHED
  ) {
    return CourseStatus.PUBLISHED;
  }

  if (
    normalized === CourseStatus.ARCHIVED
  ) {
    return CourseStatus.ARCHIVED;
  }

  return null;
}

/* =========================================================
   ARGENT
   ========================================================= */

function parseMoneyValue(
  value: unknown,
): number | null {
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return null;
  }

  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return parsed;
}

/* =========================================================
   IDENTIFIANT FORMATION
   ========================================================= */

function normalizeFormationId(
  value: string,
) {
  const normalized =
    value.trim();

  if (
    normalized.length < 5 ||
    normalized.length > 191
  ) {
    return "";
  }

  return normalized;
}

/* =========================================================
   URL PRIVÉE
   ========================================================= */

function isAllowedPrivateUrl(
  value: string,
) {
  try {
    const url = new URL(value);

    if (
      url.protocol === "https:"
    ) {
      return true;
    }

    return (
      url.protocol === "http:" &&
      (
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "::1"
      )
    );
  } catch {
    return false;
  }
}

/* =========================================================
   URL HTTPS
   ========================================================= */

function isHttpsUrl(
  value: string,
) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

/* =========================================================
   URL HTTP / HTTPS
   ========================================================= */

function isHttpUrl(
  value: string,
) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

/* =========================================================
   OBJET SIMPLE
   ========================================================= */

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/* =========================================================
   ERREUR DE VALIDATION
   ========================================================= */

function invalid(
  message: string,
): ValidationResult {
  return {
    success: false,
    message,
  };
}
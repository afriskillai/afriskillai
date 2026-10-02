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

    await db.course.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Formation supprimée avec succès.",
      formation: {
        id: formation.id,
        title: formation.title,
      },
    });
  } catch (error) {
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

function validateUpdateBody(
  body: UpdateFormationBody,
  currentStatus: CourseStatus,
  currentPublishedAt: Date | null,
): ValidationResult {
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      return invalid(
        "Le nom de la formation est invalide.",
      );
    }

    const title = body.title.trim();

    if (title.length < MIN_TITLE_LENGTH) {
      return invalid(
        `Le nom de la formation doit contenir au moins ${MIN_TITLE_LENGTH} caractères.`,
      );
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return invalid(
        `Le nom de la formation ne doit pas dépasser ${MAX_TITLE_LENGTH} caractères.`,
      );
    }

    data.title = title;
  }

  if (body.shortDescription !== undefined) {
    if (
      typeof body.shortDescription !==
      "string"
    ) {
      return invalid(
        "La courte description est invalide.",
      );
    }

    const shortDescription =
      body.shortDescription.trim();

    if (
      shortDescription.length <
      MIN_SHORT_DESCRIPTION_LENGTH
    ) {
      return invalid(
        `La courte description doit contenir au moins ${MIN_SHORT_DESCRIPTION_LENGTH} caractères.`,
      );
    }

    if (
      shortDescription.length >
      MAX_SHORT_DESCRIPTION_LENGTH
    ) {
      return invalid(
        `La courte description ne doit pas dépasser ${MAX_SHORT_DESCRIPTION_LENGTH} caractères.`,
      );
    }

    data.shortDescription =
      shortDescription;
  }

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

  if (
    body.descriptionContent !== undefined
  ) {
    if (body.descriptionContent === null) {
      data.descriptionContent = null;
    } else {
      const richDocumentValidation =
        validateRichDocument(
          body.descriptionContent,
        );

      if (!richDocumentValidation.success) {
        return invalid(
          richDocumentValidation.message,
        );
      }

      data.descriptionContent =
        richDocumentValidation.value;
    }
  }

  if (body.price !== undefined) {
    const price = parseMoneyValue(
      body.price,
    );

    if (price === null) {
      return invalid(
        "Le prix réel est invalide.",
      );
    }

    data.price = price;
  }

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

  const effectivePrice =
    typeof data.price === "number"
      ? data.price
      : undefined;

  const effectivePromotionalPrice =
    data.promotionalPrice;

  if (
    effectivePrice !== undefined &&
    typeof effectivePromotionalPrice ===
      "number" &&
    effectivePromotionalPrice >=
      effectivePrice
  ) {
    return invalid(
      "Le prix promotionnel doit être inférieur au prix réel.",
    );
  }

  if (body.currency !== undefined) {
    if (
      typeof body.currency !== "string"
    ) {
      return invalid(
        "La devise est invalide.",
      );
    }

    const currency = body.currency
      .trim()
      .toUpperCase();

    if (
      !["XOF", "EUR", "USD"].includes(
        currency,
      )
    ) {
      return invalid(
        "La devise sélectionnée n’est pas prise en charge.",
      );
    }

    data.currency = currency;
  }

  if (body.status !== undefined) {
    const parsedStatus =
      parseCourseStatus(body.status);

    if (!parsedStatus) {
      return invalid(
        "Le statut de la formation est invalide.",
      );
    }

    data.status = parsedStatus;

    if (
      parsedStatus ===
      CourseStatus.PUBLISHED
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

  if (
    !Array.isArray(value.content)
  ) {
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

  if (
    node.type === "heading"
  ) {
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

  if (
    node.type === "image"
  ) {
    const imageValidation =
      validateImageNode(node.attrs);

    if (!imageValidation.success) {
      return imageValidation;
    }
  }

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

  if (node.content !== undefined) {
    if (
      !Array.isArray(node.content)
    ) {
      return {
        success: false,
        message:
          "La structure d’un bloc de la description est invalide.",
      };
    }

    for (
      const child of node.content
    ) {
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
      typeof attrs.imageId !==
        "string" ||
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

function parseCourseStatus(
  value: unknown,
): CourseStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim().toUpperCase();

  if (
    normalized ===
    CourseStatus.DRAFT
  ) {
    return CourseStatus.DRAFT;
  }

  if (
    normalized ===
    CourseStatus.PUBLISHED
  ) {
    return CourseStatus.PUBLISHED;
  }

  return null;
}

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

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function invalid(
  message: string,
): ValidationResult {
  return {
    success: false,
    message,
  };
}
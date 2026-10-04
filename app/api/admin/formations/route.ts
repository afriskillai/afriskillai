import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import {
  CourseStatus,
} from "@/generated/prisma/enums";

import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TITLE_LENGTH = 150;
const MAX_SHORT_DESCRIPTION_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 50_000;
const MAX_PRIVATE_ACCESS_URL_LENGTH = 2_048;

const MAX_DESCRIPTION_CONTENT_DEPTH = 20;
const MAX_DESCRIPTION_CONTENT_NODES = 5_000;
const MAX_DESCRIPTION_TEXT_NODE_LENGTH = 50_000;
const MAX_DESCRIPTION_LINK_LENGTH = 2_048;

const MAX_DESCRIPTION_IMAGE_ID_LENGTH = 191;
const MAX_DESCRIPTION_IMAGE_URL_LENGTH = 4_096;
const MAX_DESCRIPTION_IMAGE_ALT_LENGTH = 300;
const MAX_DESCRIPTION_IMAGE_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_IMAGE_DIMENSION = 10_000;

const MAX_DESCRIPTION_VIDEO_ID_LENGTH = 191;
const MAX_DESCRIPTION_VIDEO_URL_LENGTH = 2_048;
const MAX_DESCRIPTION_VIDEO_TITLE_LENGTH = 300;

const ALLOWED_CURRENCIES = new Set([
  "XOF",
  "EUR",
  "USD",
]);

const ALLOWED_VIDEO_PROVIDERS = new Set([
  "youtube",
  "vimeo",
]);

const ALLOWED_DESCRIPTION_NODE_TYPES = new Set([
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
  "video",
]);

const ALLOWED_DESCRIPTION_MARK_TYPES = new Set([
  "bold",
  "italic",
  "strike",
  "code",
  "link",
]);

type CreateFormationBody = {
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

type DescriptionValidationResult =
  | {
      ok: true;
      value: Record<string, unknown> | null;
    }
  | {
      ok: false;
      message: string;
    };

type DescriptionNodeValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

type DescriptionValidationState = {
  nodeCount: number;
  textLength: number;
};

/**
 * ============================================================================
 * GET /api/admin/formations
 * ============================================================================
 */

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  try {
    const url = new URL(request.url);

    const search = cleanString(
      url.searchParams.get("search"),
    );

    const requestedStatus = cleanString(
      url.searchParams.get("status"),
    ).toLowerCase();

    const page = parsePositiveInteger(
      url.searchParams.get("page"),
      1,
    );

    const pageSize = Math.min(
      parsePositiveInteger(
        url.searchParams.get("pageSize"),
        20,
      ),
      100,
    );

    const status =
      requestedStatus &&
      requestedStatus !== "all"
        ? toPrismaCourseStatus(
            requestedStatus,
          )
        : null;

    if (
      requestedStatus &&
      requestedStatus !== "all" &&
      !status
    ) {
      return errorResponse(
        "Statut de formation invalide.",
        400,
      );
    }

    const where = {
      ...(status
        ? {
            status,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                shortDescription: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [courses, totalItems] =
      await db.$transaction([
        db.course.findMany({
          where,

          orderBy: {
            createdAt: "desc",
          },

          skip:
            (page - 1) *
            pageSize,

          take: pageSize,

          include: {
            images: {
              where: {
                type: "PRIMARY",
              },

              orderBy: {
                position: "asc",
              },

              take: 1,

              select: {
                url: true,
              },
            },

            _count: {
              select: {
                orderItems: {
                  where: {
                    order: {
                      status: "PAID",
                    },
                  },
                },

                enrollments: true,
              },
            },
          },
        }),

        db.course.count({
          where,
        }),
      ]);

    const totalPages =
      totalItems === 0
        ? 0
        : Math.ceil(
            totalItems /
              pageSize,
          );

    const items =
      courses.map(
        (course) => ({
          id:
            course.id,

          title:
            course.title,

          shortDescription:
            course.shortDescription,

          price:
            course.price,

          promotionalPrice:
            course.promotionalPrice,

          currency:
            course.currency,

          status:
            fromPrismaCourseStatus(
              course.status,
            ),

          primaryImage:
            course.images[0]
              ?.url ?? null,

          salesCount:
            course._count
              .orderItems,

          studentsCount:
            course._count
              .enrollments,

          deliveryContent: {
            hasPdf:
              Boolean(
                course.privatePdfPath,
              ),

            hasPrivateLink:
              Boolean(
                course.privateAccessUrl,
              ),
          },

          createdAt:
            course.createdAt
              .toISOString(),

          updatedAt:
            course.updatedAt
              .toISOString(),
        }),
      );

    return NextResponse.json(
      {
        success: true,

        data: {
          items,

          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,

            hasPreviousPage:
              page > 1,

            hasNextPage:
              totalPages > 0 &&
              page <
                totalPages,
          },
        },
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_FORMATIONS_GET]",
      error,
    );

    return serverError();
  }
}

/**
 * ============================================================================
 * POST /api/admin/formations
 * ============================================================================
 */

export async function POST(request: Request) {
  const session =
    await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  if (!isJsonRequest(request)) {
    return errorResponse(
      "Le corps de la requête doit être au format JSON.",
      415,
    );
  }

  let body: CreateFormationBody;

  try {
    body =
      (await request.json()) as
        CreateFormationBody;
  } catch {
    return errorResponse(
      "Le corps JSON est invalide.",
      400,
    );
  }

  const title =
    cleanString(
      body.title,
    );

  const shortDescription =
    cleanString(
      body.shortDescription,
    );

  const description =
    cleanString(
      body.description,
    );

  const currency =
    cleanString(
      body.currency,
    ).toUpperCase();

  const statusInput =
    cleanString(
      body.status,
    ).toLowerCase();

  const privateAccessUrl =
    cleanString(
      body.privateAccessUrl,
    );

  const price =
    parseMoney(
      body.price,
    );

  const promotionalPrice =
    isEmptyMoneyValue(
      body.promotionalPrice,
    )
      ? null
      : parseMoney(
          body.promotionalPrice,
        );

  if (
    title.length < 3 ||
    title.length >
      MAX_TITLE_LENGTH
  ) {
    return validationError(
      "title",
      `Le titre doit contenir entre 3 et ${MAX_TITLE_LENGTH} caractères.`,
    );
  }

  if (
    shortDescription.length <
      10 ||
    shortDescription.length >
      MAX_SHORT_DESCRIPTION_LENGTH
  ) {
    return validationError(
      "shortDescription",
      `La courte description doit contenir entre 10 et ${MAX_SHORT_DESCRIPTION_LENGTH} caractères.`,
    );
  }

  if (
    description.length < 30 ||
    description.length >
      MAX_DESCRIPTION_LENGTH
  ) {
    return validationError(
      "description",
      `La description doit contenir entre 30 et ${MAX_DESCRIPTION_LENGTH} caractères.`,
    );
  }

  const descriptionContentResult =
    validateDescriptionContent(
      body.descriptionContent,
    );

  if (
    !descriptionContentResult.ok
  ) {
    return validationError(
      "descriptionContent",
      descriptionContentResult.message,
    );
  }

  const descriptionContent =
    descriptionContentResult.value;

  if (
    price === null ||
    price < 0
  ) {
    return validationError(
      "price",
      "Le prix est invalide.",
    );
  }

  if (
    promotionalPrice !==
      null &&
    promotionalPrice < 0
  ) {
    return validationError(
      "promotionalPrice",
      "Le prix promotionnel est invalide.",
    );
  }

  if (
    promotionalPrice !==
      null &&
    promotionalPrice >=
      price
  ) {
    return validationError(
      "promotionalPrice",
      "Le prix promotionnel doit être inférieur au prix normal.",
    );
  }

  if (
    !ALLOWED_CURRENCIES.has(
      currency,
    )
  ) {
    return validationError(
      "currency",
      "La devise sélectionnée n'est pas prise en charge.",
    );
  }

  const status =
    statusInput ===
    "published"
      ? CourseStatus.PUBLISHED
      : statusInput ===
            "draft" ||
          statusInput === ""
        ? CourseStatus.DRAFT
        : null;

  if (!status) {
    return validationError(
      "status",
      "Le statut de publication est invalide.",
    );
  }

  if (
    privateAccessUrl.length >
    MAX_PRIVATE_ACCESS_URL_LENGTH
  ) {
    return validationError(
      "privateAccessUrl",
      `Le lien privé ne doit pas dépasser ${MAX_PRIVATE_ACCESS_URL_LENGTH} caractères.`,
    );
  }

  if (
    privateAccessUrl &&
    !isValidHttpUrl(
      privateAccessUrl,
    )
  ) {
    return validationError(
      "privateAccessUrl",
      "Le lien privé de la formation est invalide. Utilisez une adresse HTTPS valide.",
    );
  }

  if (
    privateAccessUrl &&
    !isSecurePrivateUrl(
      privateAccessUrl,
    )
  ) {
    return validationError(
      "privateAccessUrl",
      "Le lien privé doit utiliser HTTPS.",
    );
  }

  try {
    const now =
      new Date();

    const course =
      await db.course.create({
        data: {
          title,

          shortDescription,

          description,

          descriptionContent:
            descriptionContent === null
              ? Prisma.JsonNull
              : (descriptionContent as Prisma.InputJsonValue),

          price,

          promotionalPrice,

          currency,

          status,

          publishedAt:
            status ===
            CourseStatus.PUBLISHED
              ? now
              : null,

          privateAccessUrl:
            privateAccessUrl ||
            null,
        },

        select: {
          id: true,
          title: true,
          status: true,

          privatePdfPath: true,
          privateAccessUrl: true,

          createdAt: true,
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          status ===
          CourseStatus.PUBLISHED
            ? "Formation créée et publiée avec succès."
            : "Formation enregistrée en brouillon avec succès.",

        formation: {
          id:
            course.id,

          title:
            course.title,

          status:
            fromPrismaCourseStatus(
              course.status,
            ),

          deliveryContent: {
            hasPdf:
              Boolean(
                course.privatePdfPath,
              ),

            hasPrivateLink:
              Boolean(
                course.privateAccessUrl,
              ),
          },

          createdAt:
            course.createdAt
              .toISOString(),
        },
      },
      {
        status: 201,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_FORMATIONS_POST]",
      error,
    );

    return serverError();
  }
}

/**
 * ============================================================================
 * DESCRIPTION ENRICHIE
 * ============================================================================
 */

function validateDescriptionContent(
  value: unknown,
): DescriptionValidationResult {
  if (
    value === undefined ||
    value === null
  ) {
    return {
      ok: true,
      value: null,
    };
  }

  if (!isPlainObject(value)) {
    return {
      ok: false,
      message:
        "La description enrichie est invalide.",
    };
  }

  if (value.type !== "doc") {
    return {
      ok: false,
      message:
        "La description enrichie doit contenir un document valide.",
    };
  }

  const state: DescriptionValidationState =
    {
      nodeCount: 0,
      textLength: 0,
    };

  const result =
    validateDescriptionNode(
      value,
      0,
      state,
    );

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    value,
  };
}

function validateDescriptionNode(
  node: Record<string, unknown>,
  depth: number,
  state: DescriptionValidationState,
): DescriptionNodeValidationResult {
  if (
    depth >
    MAX_DESCRIPTION_CONTENT_DEPTH
  ) {
    return {
      ok: false,
      message:
        "La description enrichie contient trop de niveaux imbriqués.",
    };
  }

  state.nodeCount += 1;

  if (
    state.nodeCount >
    MAX_DESCRIPTION_CONTENT_NODES
  ) {
    return {
      ok: false,
      message:
        "La description enrichie contient trop d'éléments.",
    };
  }

  const type =
    typeof node.type ===
    "string"
      ? node.type
      : "";

  if (
    !ALLOWED_DESCRIPTION_NODE_TYPES.has(
      type,
    )
  ) {
    return {
      ok: false,
      message:
        "La description enrichie contient un élément non autorisé.",
    };
  }

  if (type === "text") {
    if (
      typeof node.text !==
      "string"
    ) {
      return {
        ok: false,
        message:
          "Un élément texte de la description est invalide.",
      };
    }

    if (
      node.text.length >
      MAX_DESCRIPTION_TEXT_NODE_LENGTH
    ) {
      return {
        ok: false,
        message:
          "Un bloc de texte de la description est trop long.",
      };
    }

    state.textLength +=
      node.text.length;

    if (
      state.textLength >
      MAX_DESCRIPTION_LENGTH
    ) {
      return {
        ok: false,
        message:
          `Le contenu texte de la description ne doit pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères.`,
      };
    }
  } else if (
    node.text !== undefined
  ) {
    return {
      ok: false,
      message:
        "La structure de la description enrichie est invalide.",
    };
  }

  const attrsResult =
    validateDescriptionNodeAttributes(
      type,
      node.attrs,
    );

  if (!attrsResult.ok) {
    return attrsResult;
  }

  const marksResult =
    validateDescriptionMarks(
      node.marks,
      type,
    );

  if (!marksResult.ok) {
    return marksResult;
  }

  if (
    node.content !==
    undefined
  ) {
    if (
      !Array.isArray(
        node.content,
      )
    ) {
      return {
        ok: false,
        message:
          "La structure de la description enrichie est invalide.",
      };
    }

    for (
      const child of
      node.content
    ) {
      if (
        !isPlainObject(
          child,
        )
      ) {
        return {
          ok: false,
          message:
            "La description enrichie contient un élément invalide.",
        };
      }

      const childResult =
        validateDescriptionNode(
          child,
          depth + 1,
          state,
        );

      if (!childResult.ok) {
        return childResult;
      }
    }
  }

  return {
    ok: true,
  };
}

function validateDescriptionNodeAttributes(
  type: string,
  attrs: unknown,
): DescriptionNodeValidationResult {
  if (
    attrs === undefined ||
    attrs === null
  ) {
    if (type === "image") {
      return {
        ok: false,
        message:
          "Une image de la description est incomplète.",
      };
    }

    if (type === "video") {
      return {
        ok: false,
        message:
          "Une vidéo de la description est incomplète.",
      };
    }

    return {
      ok: true,
    };
  }

  if (!isPlainObject(attrs)) {
    return {
      ok: false,
      message:
        "Les attributs de la description enrichie sont invalides.",
    };
  }

  if (type === "heading") {
    const level =
      attrs.level;

    if (
      level !== 1 &&
      level !== 2 &&
      level !== 3 &&
      level !== 4
    ) {
      return {
        ok: false,
        message:
          "Le niveau d'un titre de la description est invalide.",
      };
    }

    return {
      ok: true,
    };
  }

  if (
    type === "orderedList"
  ) {
    if (
      attrs.start !==
        undefined &&
      (
        typeof attrs.start !==
          "number" ||
        !Number.isSafeInteger(
          attrs.start,
        ) ||
        attrs.start < 1
      )
    ) {
      return {
        ok: false,
        message:
          "La numérotation d'une liste est invalide.",
      };
    }

    return {
      ok: true,
    };
  }

  if (type === "image") {
    return validateDescriptionImageAttributes(
      attrs,
    );
  }

  if (type === "video") {
    return validateDescriptionVideoAttributes(
      attrs,
    );
  }

  if (
    Object.keys(attrs).length >
    0
  ) {
    return {
      ok: false,
      message:
        "La description enrichie contient des attributs non autorisés.",
    };
  }

  return {
    ok: true,
  };
}

/**
 * ============================================================================
 * IMAGE DE DESCRIPTION
 * ============================================================================
 *
 * Compatibilité TipTap :
 * - src
 * - imageId
 * - alt
 * - title
 * - width
 * - height
 * - loading
 * - decoding
 *
 * width / height peuvent être null, numériques ou représentés sous forme
 * de chaîne. Ils sont uniquement des métadonnées de présentation.
 *
 * Aucun style arbitraire, event handler, HTML ou classe CSS arbitraire
 * n'est accepté.
 * ============================================================================
 */

function validateDescriptionImageAttributes(
  attrs: Record<string, unknown>,
): DescriptionNodeValidationResult {
  const allowedKeys =
    new Set([
      "src",
      "imageId",
      "alt",
      "title",
      "width",
      "height",
      "loading",
      "decoding",
    ]);

  for (
    const key of
    Object.keys(attrs)
  ) {
    if (
      !allowedKeys.has(
        key,
      )
    ) {
      return {
        ok: false,
        message:
          `Une image de la description contient un attribut non autorisé : ${key}.`,
      };
    }
  }

  const src =
    cleanString(
      attrs.src,
    );

  const imageId =
    cleanString(
      attrs.imageId,
    );

  const alt =
    cleanString(
      attrs.alt,
    );

  const title =
    cleanString(
      attrs.title,
    );

  if (!src) {
    return {
      ok: false,
      message:
        "Une image de la description ne possède pas d'adresse valide.",
    };
  }

  if (
    src.length >
    MAX_DESCRIPTION_IMAGE_URL_LENGTH
  ) {
    return {
      ok: false,
      message:
        "L'adresse d'une image de la description est trop longue.",
    };
  }

  if (
    !isValidHttpsUrl(
      src,
    )
  ) {
    return {
      ok: false,
      message:
        "Une image de la description possède une adresse invalide.",
    };
  }

  if (
    imageId.length >
    MAX_DESCRIPTION_IMAGE_ID_LENGTH
  ) {
    return {
      ok: false,
      message:
        "L'identifiant d'une image de la description est invalide.",
    };
  }

  if (
    alt.length >
    MAX_DESCRIPTION_IMAGE_ALT_LENGTH
  ) {
    return {
      ok: false,
      message:
        "Le texte alternatif d'une image de la description est trop long.",
    };
  }

  if (
    title.length >
    MAX_DESCRIPTION_IMAGE_TITLE_LENGTH
  ) {
    return {
      ok: false,
      message:
        "Le titre d'une image de la description est trop long.",
    };
  }

  const widthResult =
    validateImageDimension(
      attrs.width,
      "largeur",
    );

  if (!widthResult.ok) {
    return widthResult;
  }

  const heightResult =
    validateImageDimension(
      attrs.height,
      "hauteur",
    );

  if (!heightResult.ok) {
    return heightResult;
  }

  if (
    attrs.loading !== undefined &&
    attrs.loading !== null
  ) {
    const loading =
      cleanString(
        attrs.loading,
      ).toLowerCase();

    if (
      loading !== "" &&
      loading !== "lazy" &&
      loading !== "eager"
    ) {
      return {
        ok: false,
        message:
          "Le mode de chargement d'une image de la description est invalide.",
      };
    }
  }

  if (
    attrs.decoding !== undefined &&
    attrs.decoding !== null
  ) {
    const decoding =
      cleanString(
        attrs.decoding,
      ).toLowerCase();

    if (
      decoding !== "" &&
      decoding !== "async" &&
      decoding !== "sync" &&
      decoding !== "auto"
    ) {
      return {
        ok: false,
        message:
          "Le mode de décodage d'une image de la description est invalide.",
      };
    }
  }

  return {
    ok: true,
  };
}

function validateImageDimension(
  value: unknown,
  label: string,
): DescriptionNodeValidationResult {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return {
      ok: true,
    };
  }

  if (
    typeof value === "number"
  ) {
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      value >
        MAX_DESCRIPTION_IMAGE_DIMENSION
    ) {
      return {
        ok: false,
        message:
          `La ${label} d'une image de la description est invalide.`,
      };
    }

    return {
      ok: true,
    };
  }

  if (
    typeof value !== "string"
  ) {
    return {
      ok: false,
      message:
        `La ${label} d'une image de la description est invalide.`,
    };
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return {
      ok: true,
    };
  }

  if (
    normalized === "auto"
  ) {
    return {
      ok: true,
    };
  }

  const numericMatch =
    normalized.match(
      /^(\d+(?:\.\d+)?)(px)?$/i,
    );

  if (!numericMatch) {
    return {
      ok: false,
      message:
        `La ${label} d'une image de la description est invalide.`,
    };
  }

  const parsed =
    Number(
      numericMatch[1],
    );

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0 ||
    parsed >
      MAX_DESCRIPTION_IMAGE_DIMENSION
  ) {
    return {
      ok: false,
      message:
        `La ${label} d'une image de la description est invalide.`,
    };
  }

  return {
    ok: true,
  };
}

/**
 * ============================================================================
 * VIDÉOS PUBLIQUES DE DÉMONSTRATION
 * ============================================================================
 */

function validateDescriptionVideoAttributes(
  attrs: Record<string, unknown>,
): DescriptionNodeValidationResult {
  const allowedKeys =
    new Set([
      "provider",
      "videoId",
      "videoUrl",
      "videoTitle",
    ]);

  for (
    const key of
    Object.keys(attrs)
  ) {
    if (
      !allowedKeys.has(
        key,
      )
    ) {
      return {
        ok: false,
        message:
          "Une vidéo de la description contient un attribut non autorisé.",
      };
    }
  }

  const provider =
    cleanString(
      attrs.provider,
    ).toLowerCase();

  const videoId =
    cleanString(
      attrs.videoId,
    );

  const videoUrl =
    cleanString(
      attrs.videoUrl,
    );

  const videoTitle =
    cleanString(
      attrs.videoTitle,
    );

  if (
    !provider ||
    !ALLOWED_VIDEO_PROVIDERS.has(
      provider,
    )
  ) {
    return {
      ok: false,
      message:
        "Le fournisseur de la vidéo est invalide. Seules les vidéos YouTube et Vimeo sont autorisées.",
    };
  }

  if (
    !videoId ||
    videoId.length >
      MAX_DESCRIPTION_VIDEO_ID_LENGTH
  ) {
    return {
      ok: false,
      message:
        "L'identifiant de la vidéo est invalide.",
    };
  }

  if (
    !isSafeVideoId(
      provider,
      videoId,
    )
  ) {
    return {
      ok: false,
      message:
        "L'identifiant de la vidéo n'est pas valide.",
    };
  }

  if (
    !videoUrl ||
    videoUrl.length >
      MAX_DESCRIPTION_VIDEO_URL_LENGTH
  ) {
    return {
      ok: false,
      message:
        "L'adresse de la vidéo est invalide.",
    };
  }

  if (
    !isValidHttpsUrl(
      videoUrl,
    )
  ) {
    return {
      ok: false,
      message:
        "L'adresse de la vidéo doit être une adresse HTTPS valide.",
    };
  }

  if (
    videoTitle.length >
    MAX_DESCRIPTION_VIDEO_TITLE_LENGTH
  ) {
    return {
      ok: false,
      message:
        "Le titre de la vidéo est trop long.",
    };
  }

  if (
    !doesVideoUrlMatchProviderAndId(
      provider,
      videoId,
      videoUrl,
    )
  ) {
    return {
      ok: false,
      message:
        "L'adresse de la vidéo ne correspond pas au fournisseur ou à l'identifiant indiqué.",
    };
  }

  return {
    ok: true,
  };
}

function isSafeVideoId(
  provider: string,
  videoId: string,
) {
  if (provider === "youtube") {
    return /^[A-Za-z0-9_-]{11}$/.test(
      videoId,
    );
  }

  if (provider === "vimeo") {
    return /^\d{5,20}$/.test(
      videoId,
    );
  }

  return false;
}

function doesVideoUrlMatchProviderAndId(
  provider: string,
  videoId: string,
  videoUrl: string,
) {
  try {
    const url =
      new URL(videoUrl);

    const hostname =
      url.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    if (
      provider ===
      "youtube"
    ) {
      if (
        hostname ===
        "youtu.be"
      ) {
        const pathId =
          url.pathname
            .split("/")
            .filter(Boolean)[0] ??
          "";

        return (
          pathId ===
          videoId
        );
      }

      if (
        hostname ===
          "youtube.com" ||
        hostname ===
          "m.youtube.com" ||
        hostname ===
          "music.youtube.com" ||
        hostname ===
          "youtube-nocookie.com"
      ) {
        const queryId =
          url.searchParams.get(
            "v",
          );

        if (
          queryId ===
          videoId
        ) {
          return true;
        }

        const parts =
          url.pathname
            .split("/")
            .filter(Boolean);

        if (
          parts.length >= 2 &&
          (
            parts[0] ===
              "embed" ||
            parts[0] ===
              "shorts" ||
            parts[0] ===
              "live"
          ) &&
          parts[1] ===
            videoId
        ) {
          return true;
        }
      }

      return false;
    }

    if (
      provider ===
      "vimeo"
    ) {
      if (
        hostname !==
          "vimeo.com" &&
        hostname !==
          "player.vimeo.com"
      ) {
        return false;
      }

      const parts =
        url.pathname
          .split("/")
          .filter(Boolean);

      return parts.includes(
        videoId,
      );
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * ============================================================================
 * MARKS / FORMATAGE
 * ============================================================================
 */

function validateDescriptionMarks(
  marks: unknown,
  nodeType: string,
): DescriptionNodeValidationResult {
  if (
    marks === undefined ||
    marks === null
  ) {
    return {
      ok: true,
    };
  }

  if (
    nodeType !== "text"
  ) {
    return {
      ok: false,
      message:
        "Une mise en forme de la description est placée sur un élément invalide.",
    };
  }

  if (!Array.isArray(marks)) {
    return {
      ok: false,
      message:
        "La mise en forme de la description est invalide.",
    };
  }

  for (const mark of marks) {
    if (!isPlainObject(mark)) {
      return {
        ok: false,
        message:
          "La description contient une mise en forme invalide.",
      };
    }

    const markType =
      typeof mark.type ===
      "string"
        ? mark.type
        : "";

    if (
      !ALLOWED_DESCRIPTION_MARK_TYPES.has(
        markType,
      )
    ) {
      return {
        ok: false,
        message:
          "La description contient une mise en forme non autorisée.",
      };
    }

    if (markType === "link") {
      const linkResult =
        validateDescriptionLinkMark(
          mark,
        );

      if (!linkResult.ok) {
        return linkResult;
      }

      continue;
    }

    if (
      mark.attrs !==
        undefined &&
      mark.attrs !== null
    ) {
      if (
        !isPlainObject(
          mark.attrs,
        ) ||
        Object.keys(
          mark.attrs,
        ).length > 0
      ) {
        return {
          ok: false,
          message:
            "Une mise en forme de la description contient des attributs non autorisés.",
        };
      }
    }
  }

  return {
    ok: true,
  };
}

function validateDescriptionLinkMark(
  mark: Record<string, unknown>,
): DescriptionNodeValidationResult {
  if (
    !isPlainObject(
      mark.attrs,
    )
  ) {
    return {
      ok: false,
      message:
        "Un lien de la description est invalide.",
    };
  }

  const allowedKeys =
    new Set([
      "href",
      "target",
      "rel",
      "class",
    ]);

  for (
    const key of
    Object.keys(mark.attrs)
  ) {
    if (
      !allowedKeys.has(
        key,
      )
    ) {
      return {
        ok: false,
        message:
          "Un lien de la description contient un attribut non autorisé.",
      };
    }
  }

  const href =
    cleanString(
      mark.attrs.href,
    );

  if (
    !href ||
    href.length >
      MAX_DESCRIPTION_LINK_LENGTH ||
    !isValidHttpUrl(href)
  ) {
    return {
      ok: false,
      message:
        "Un lien de la description est invalide.",
    };
  }

  const target =
    cleanString(
      mark.attrs.target,
    );

  if (
    target &&
    target !== "_blank" &&
    target !== "_self"
  ) {
    return {
      ok: false,
      message:
        "La cible d'un lien de la description est invalide.",
    };
  }

  return {
    ok: true,
  };
}

/**
 * ============================================================================
 * COURSE STATUS
 * ============================================================================
 */

function toPrismaCourseStatus(
  status: string,
): CourseStatus | null {
  switch (status) {
    case "draft":
      return CourseStatus.DRAFT;

    case "published":
      return CourseStatus.PUBLISHED;

    case "archived":
      return CourseStatus.ARCHIVED;

    default:
      return null;
  }
}

function fromPrismaCourseStatus(
  status: CourseStatus,
) {
  switch (status) {
    case CourseStatus.PUBLISHED:
      return "published" as const;

    case CourseStatus.ARCHIVED:
      return "archived" as const;

    default:
      return "draft" as const;
  }
}

/**
 * ============================================================================
 * MONEY
 * ============================================================================
 */

function parseMoney(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isSafeInteger(
      value,
    ) &&
    value >= 0
  ) {
    return value;
  }

  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .replace(
        /\s/g,
        "",
      );

  if (
    !/^\d+$/.test(
      normalized,
    )
  ) {
    return null;
  }

  const parsed =
    Number(normalized);

  if (
    !Number.isSafeInteger(
      parsed,
    ) ||
    parsed < 0
  ) {
    return null;
  }

  return parsed;
}

function isEmptyMoneyValue(
  value: unknown,
) {
  return (
    value === undefined ||
    value === null ||
    (
      typeof value ===
        "string" &&
      value.trim() === ""
    )
  );
}

/**
 * ============================================================================
 * JSON
 * ============================================================================
 */

function isPlainObject(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  if (
    typeof value !==
      "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(
      value,
    );

  return (
    prototype ===
      Object.prototype ||
    prototype === null
  );
}

/**
 * ============================================================================
 * STRING
 * ============================================================================
 */

function cleanString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

/**
 * ============================================================================
 * URL
 * ============================================================================
 */

function isValidHttpUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "https:" ||
      url.protocol ===
        "http:"
    );
  } catch {
    return false;
  }
}

function isValidHttpsUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
      "https:"
    );
  } catch {
    return false;
  }
}

/**
 * ============================================================================
 * URL PRIVÉE
 * ============================================================================
 */

function isSecurePrivateUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    if (
      url.protocol ===
      "https:"
    ) {
      return true;
    }

    return (
      url.protocol ===
        "http:" &&
      (
        url.hostname ===
          "localhost" ||
        url.hostname ===
          "127.0.0.1" ||
        url.hostname ===
          "::1"
      )
    );
  } catch {
    return false;
  }
}

/**
 * ============================================================================
 * PAGINATION
 * ============================================================================
 */

function parsePositiveInteger(
  value: string | null,
  fallback: number,
) {
  if (!value) {
    return fallback;
  }

  const parsed =
    Number(value);

  if (
    !Number.isSafeInteger(
      parsed,
    ) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

/**
 * ============================================================================
 * REQUEST
 * ============================================================================
 */

function isJsonRequest(
  request: Request,
) {
  return (
    request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes(
        "application/json",
      ) ?? false
  );
}

/**
 * ============================================================================
 * RESPONSES
 * ============================================================================
 */

function validationError(
  field: string,
  message: string,
) {
  return NextResponse.json(
    {
      success: false,
      message,

      fieldErrors: {
        [field]:
          message,
      },
    },
    {
      status: 400,
      headers:
        noStoreHeaders(),
    },
  );
}

function errorResponse(
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers:
        noStoreHeaders(),
    },
  );
}

function unauthorized() {
  return errorResponse(
    "Authentification administrateur requise.",
    401,
  );
}

function serverError() {
  return errorResponse(
    "Une erreur interne est survenue.",
    500,
  );
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, no-cache, must-revalidate, max-age=0",

    Pragma:
      "no-cache",

    Expires:
      "0",
  };
}
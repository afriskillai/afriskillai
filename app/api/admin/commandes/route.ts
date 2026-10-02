import { NextResponse } from "next/server";

import {
  OrderStatus,
} from "@/generated/prisma/enums";

import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
        ? toPrismaOrderStatus(
            requestedStatus,
          )
        : null;

    if (
      requestedStatus &&
      requestedStatus !== "all" &&
      !status
    ) {
      return errorResponse(
        "Statut de commande invalide.",
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
                reference: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },

              {
                user: {
                  email: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },

              {
                user: {
                  firstName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },

              {
                user: {
                  lastName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },

              {
                items: {
                  some: {
                    courseTitle: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [orders, totalItems] =
      await db.$transaction([
        db.order.findMany({
          where,

          orderBy: {
            createdAt: "desc",
          },

          skip: (page - 1) * pageSize,
          take: pageSize,

          select: {
            id: true,
            reference: true,
            status: true,

            totalAmount: true,
            currency: true,

            createdAt: true,

            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },

            items: {
              orderBy: {
                createdAt: "asc",
              },

              select: {
                id: true,
                courseId: true,
                courseTitle: true,
                quantity: true,
              },
            },

            payments: {
              orderBy: {
                createdAt: "desc",
              },

              take: 1,

              select: {
                reference: true,
              },
            },
          },
        }),

        db.order.count({
          where,
        }),
      ]);

    const totalPages =
      totalItems === 0
        ? 0
        : Math.ceil(totalItems / pageSize);

    const items = orders.map((order) => {
      const firstItem =
        order.items[0];

      const customerName =
        buildName(
          order.user.firstName,
          order.user.lastName,
          order.user.email,
        );

      const itemsCount =
        order.items.reduce(
          (total, item) =>
            total +
            Math.max(0, item.quantity),
          0,
        );

      return {
        id: order.id,

        reference: order.reference,

        customer: {
          id: order.user.id,
          name: customerName,
          email: order.user.email,
        },

        course: {
          id: firstItem?.courseId,

          title: firstItem
            ? order.items.length > 1
              ? `${firstItem.courseTitle} + ${
                  order.items.length - 1
                } autre${
                  order.items.length - 1 > 1
                    ? "s"
                    : ""
                }`
              : firstItem.courseTitle
            : "Aucune formation",
        },

        itemsCount,

        amount: order.totalAmount,
        currency: order.currency,

        status:
          fromPrismaOrderStatus(
            order.status,
          ),

        paymentReference:
          order.payments[0]?.reference ??
          null,

        createdAt:
          order.createdAt.toISOString(),
      };
    });

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

            hasPreviousPage: page > 1,

            hasNextPage:
              totalPages > 0 &&
              page < totalPages,
          },
        },
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_COMMANDES_GET]",
      error,
    );

    return serverError();
  }
}

/**
 * La création d'une commande n'est pas autorisée
 * depuis cette route d'administration.
 */
export async function POST() {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  return errorResponse(
    "La création des commandes doit passer par le processus de paiement sécurisé.",
    405,
  );
}

function toPrismaOrderStatus(
  status: string,
): OrderStatus | null {
  switch (status) {
    case "pending":
      return OrderStatus.PENDING;

    case "paid":
      return OrderStatus.PAID;

    case "failed":
      return OrderStatus.FAILED;

    case "cancelled":
      return OrderStatus.CANCELLED;

    case "refunded":
      return OrderStatus.REFUNDED;

    default:
      return null;
  }
}

function fromPrismaOrderStatus(
  status: OrderStatus,
) {
  switch (status) {
    case OrderStatus.PAID:
      return "paid" as const;

    case OrderStatus.FAILED:
      return "failed" as const;

    case OrderStatus.CANCELLED:
      return "cancelled" as const;

    case OrderStatus.REFUNDED:
      return "refunded" as const;

    default:
      return "pending" as const;
  }
}

function buildName(
  firstName: string | null,
  lastName: string | null,
  email: string,
) {
  const name = [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || email;
}

function cleanString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
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
      headers: noStoreHeaders(),
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
      "no-store, max-age=0",
  };
}
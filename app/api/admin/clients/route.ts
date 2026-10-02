import { NextResponse } from "next/server";

import {
  OrderStatus,
  UserStatus,
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
        ? toPrismaUserStatus(
            requestedStatus,
          )
        : null;

    if (
      requestedStatus &&
      requestedStatus !== "all" &&
      !status
    ) {
      return errorResponse(
        "Statut client invalide.",
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
                email: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },

              {
                firstName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },

              {
                lastName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [users, totalItems] =
      await db.$transaction([
        db.user.findMany({
          where,

          orderBy: {
            createdAt: "desc",
          },

          skip: (page - 1) * pageSize,
          take: pageSize,

          select: {
            id: true,

            firstName: true,
            lastName: true,

            email: true,
            status: true,

            createdAt: true,
            lastActivityAt: true,

            enrollments: {
              where: {
                status: {
                  in: [
                    "ACTIVE",
                    "COMPLETED",
                  ],
                },
              },

              select: {
                courseId: true,
              },
            },

            orders: {
              where: {
                status: OrderStatus.PAID,
              },

              select: {
                totalAmount: true,
                currency: true,
              },
            },

            _count: {
              select: {
                orders: true,
              },
            },
          },
        }),

        db.user.count({
          where,
        }),
      ]);

    const totalPages =
      totalItems === 0
        ? 0
        : Math.ceil(totalItems / pageSize);

    const items = users.map((user) => {
      /**
       * L'interface actuelle possède une seule devise
       * par ligne client.
       *
       * Tant que la plateforme travaille principalement
       * en XOF, on utilise XOF comme devise de synthèse.
       *
       * Si plusieurs devises réelles apparaissent plus
       * tard, la page statistiques les séparera.
       */
      const currency =
        determinePrimaryCurrency(
          user.orders.map(
            (order) => order.currency,
          ),
        );

      const totalSpent =
        user.orders
          .filter(
            (order) =>
              order.currency === currency,
          )
          .reduce(
            (total, order) =>
              total +
              order.totalAmount,
            0,
          );

      const uniqueCourses =
        new Set(
          user.enrollments.map(
            (enrollment) =>
              enrollment.courseId,
          ),
        );

      return {
        id: user.id,

        name: buildName(
          user.firstName,
          user.lastName,
          user.email,
        ),

        email: user.email,

        status:
          fromPrismaUserStatus(
            user.status,
          ),

        ordersCount:
          user._count.orders,

        formationsCount:
          uniqueCourses.size,

        totalSpent,
        currency,

        createdAt:
          user.createdAt.toISOString(),

        lastActivityAt:
          user.lastActivityAt
            ?.toISOString() ?? null,
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
      "[ADMIN_CLIENTS_GET]",
      error,
    );

    return serverError();
  }
}

/**
 * La création de comptes clients appartient au
 * futur parcours d'inscription public.
 */
export async function POST() {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  return errorResponse(
    "La création d'un client doit passer par le parcours d'inscription sécurisé.",
    405,
  );
}

function toPrismaUserStatus(
  status: string,
): UserStatus | null {
  switch (status) {
    case "active":
      return UserStatus.ACTIVE;

    case "inactive":
      return UserStatus.INACTIVE;

    case "suspended":
      return UserStatus.SUSPENDED;

    default:
      return null;
  }
}

function fromPrismaUserStatus(
  status: UserStatus,
) {
  switch (status) {
    case UserStatus.INACTIVE:
      return "inactive" as const;

    case UserStatus.SUSPENDED:
      return "suspended" as const;

    default:
      return "active" as const;
  }
}

function determinePrimaryCurrency(
  currencies: string[],
) {
  if (currencies.length === 0) {
    return "XOF";
  }

  const counts =
    new Map<string, number>();

  for (const currency of currencies) {
    counts.set(
      currency,
      (counts.get(currency) ?? 0) + 1,
    );
  }

  let selected = "XOF";
  let highestCount = 0;

  for (const [
    currency,
    count,
  ] of counts) {
    if (count > highestCount) {
      selected = currency;
      highestCount = count;
    }
  }

  return selected;
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
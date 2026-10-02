import { NextResponse } from "next/server";

import {
  CourseStatus,
  EnrollmentStatus,
  OrderStatus,
  PaymentStatus,
  UserStatus,
} from "@/generated/prisma/enums";

import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/statistiques
 *
 * Retourne les principales statistiques administrateur
 * d'AfriSkill AI.
 *
 * Sécurité :
 * - route réservée à l'administrateur authentifié ;
 * - aucune donnée sensible utilisateur n'est retournée ;
 * - aucun secret de paiement n'est exposé ;
 * - les revenus sont calculés uniquement à partir des
 *   paiements réellement marqués PAID.
 */
export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Non autorisé.",
        },
        {
          status: 401,
          headers: noStoreHeaders,
        },
      );
    }

    const now = new Date();

    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );

    const nextMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    );

    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    /*
     * Fenêtre utilisée pour le graphique :
     * 12 mois, mois courant inclus.
     */
    const chartStart = new Date(
      now.getFullYear(),
      now.getMonth() - 11,
      1,
    );

    const [
      totalClients,
      activeClients,

      totalCourses,
      publishedCourses,
      draftCourses,

      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      cancelledOrders,
      refundedOrders,

      activeEnrollments,

      paidPayments,
      currentMonthPaidPayments,
      previousMonthPaidPayments,

      recentOrders,

      paidOrderItems,

      revenuePaymentsForChart,
    ] = await Promise.all([
      // ---------------------------------------------------------------------
      // CLIENTS
      // ---------------------------------------------------------------------

      db.user.count(),

      db.user.count({
        where: {
          status: UserStatus.ACTIVE,
        },
      }),

      // ---------------------------------------------------------------------
      // FORMATIONS
      // ---------------------------------------------------------------------

      db.course.count(),

      db.course.count({
        where: {
          status: CourseStatus.PUBLISHED,
        },
      }),

      db.course.count({
        where: {
          status: CourseStatus.DRAFT,
        },
      }),

      // ---------------------------------------------------------------------
      // COMMANDES
      // ---------------------------------------------------------------------

      db.order.count(),

      db.order.count({
        where: {
          status: OrderStatus.PAID,
        },
      }),

      db.order.count({
        where: {
          status: OrderStatus.PENDING,
        },
      }),

      db.order.count({
        where: {
          status: OrderStatus.FAILED,
        },
      }),

      db.order.count({
        where: {
          status: OrderStatus.CANCELLED,
        },
      }),

      db.order.count({
        where: {
          status: OrderStatus.REFUNDED,
        },
      }),

      // ---------------------------------------------------------------------
      // ACCÈS / ENROLLMENTS
      // ---------------------------------------------------------------------

      db.enrollment.count({
        where: {
          status: EnrollmentStatus.ACTIVE,
        },
      }),

      // ---------------------------------------------------------------------
      // PAIEMENTS PAYÉS
      // ---------------------------------------------------------------------

      db.payment.findMany({
        where: {
          status: PaymentStatus.PAID,
        },

        select: {
          amount: true,
          currency: true,
          paidAt: true,
          createdAt: true,
        },
      }),

      db.payment.findMany({
        where: {
          status: PaymentStatus.PAID,

          OR: [
            {
              paidAt: {
                gte: currentMonthStart,
                lt: nextMonthStart,
              },
            },

            {
              paidAt: null,
              createdAt: {
                gte: currentMonthStart,
                lt: nextMonthStart,
              },
            },
          ],
        },

        select: {
          amount: true,
          currency: true,
        },
      }),

      db.payment.findMany({
        where: {
          status: PaymentStatus.PAID,

          OR: [
            {
              paidAt: {
                gte: previousMonthStart,
                lt: currentMonthStart,
              },
            },

            {
              paidAt: null,
              createdAt: {
                gte: previousMonthStart,
                lt: currentMonthStart,
              },
            },
          ],
        },

        select: {
          amount: true,
          currency: true,
        },
      }),

      // ---------------------------------------------------------------------
      // COMMANDES RÉCENTES
      // ---------------------------------------------------------------------

      db.order.findMany({
        orderBy: {
          createdAt: "desc",
        },

        take: 8,

        select: {
          id: true,
          reference: true,
          status: true,
          totalAmount: true,
          currency: true,
          customerFirstName: true,
          customerLastName: true,
          customerEmail: true,
          createdAt: true,
          paidAt: true,

          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },

          items: {
            select: {
              courseTitle: true,
              quantity: true,
            },
          },
        },
      }),

      // ---------------------------------------------------------------------
      // FORMATIONS VENDUES
      // ---------------------------------------------------------------------

      db.orderItem.findMany({
        where: {
          order: {
            status: OrderStatus.PAID,
          },
        },

        select: {
          courseId: true,
          courseTitle: true,
          quantity: true,
          totalAmount: true,
          currency: true,
        },
      }),

      // ---------------------------------------------------------------------
      // REVENUS 12 DERNIERS MOIS
      // ---------------------------------------------------------------------

      db.payment.findMany({
        where: {
          status: PaymentStatus.PAID,

          OR: [
            {
              paidAt: {
                gte: chartStart,
              },
            },

            {
              paidAt: null,
              createdAt: {
                gte: chartStart,
              },
            },
          ],
        },

        select: {
          amount: true,
          currency: true,
          paidAt: true,
          createdAt: true,
        },
      }),
    ]);

    // =======================================================================
    // REVENUS
    // =======================================================================

    /*
     * On ne mélange jamais mathématiquement des devises différentes.
     *
     * Exemple :
     * 10 000 XOF + 20 EUR ne doit jamais devenir "10 020".
     *
     * Les montants sont donc regroupés par devise.
     */
    const revenueByCurrency =
      aggregateAmountsByCurrency(paidPayments);

    const currentMonthRevenueByCurrency =
      aggregateAmountsByCurrency(
        currentMonthPaidPayments,
      );

    const previousMonthRevenueByCurrency =
      aggregateAmountsByCurrency(
        previousMonthPaidPayments,
      );

    // =======================================================================
    // FORMATIONS LES PLUS VENDUES
    // =======================================================================

    const topCourseMap = new Map<
      string,
      {
        courseId: string;
        title: string;
        sales: number;
        revenueByCurrency: Record<string, number>;
      }
    >();

    for (const item of paidOrderItems) {
      const existing = topCourseMap.get(item.courseId);

      if (!existing) {
        topCourseMap.set(item.courseId, {
          courseId: item.courseId,
          title: item.courseTitle,
          sales: item.quantity,
          revenueByCurrency: {
            [item.currency]: item.totalAmount,
          },
        });

        continue;
      }

      existing.sales += item.quantity;

      existing.revenueByCurrency[item.currency] =
        (existing.revenueByCurrency[item.currency] ?? 0) +
        item.totalAmount;
    }

    const topCourses = Array.from(
      topCourseMap.values(),
    )
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    // =======================================================================
    // GRAPHIQUE 12 MOIS
    // =======================================================================

    const revenueChart = createRevenueChart(
      chartStart,
      revenuePaymentsForChart,
    );

    // =======================================================================
    // COMMANDES RÉCENTES
    // =======================================================================

    const formattedRecentOrders = recentOrders.map(
      (order) => {
        const firstName =
          order.customerFirstName ??
          order.user.firstName ??
          "";

        const lastName =
          order.customerLastName ??
          order.user.lastName ??
          "";

        const fullName =
          `${firstName} ${lastName}`.trim();

        return {
          id: order.id,
          reference: order.reference,

          customer: {
            name:
              fullName ||
              order.customerEmail ||
              order.user.email,

            email:
              order.customerEmail ||
              order.user.email,
          },

          formations: order.items.map((item) => ({
            title: item.courseTitle,
            quantity: item.quantity,
          })),

          totalAmount: order.totalAmount,
          currency: order.currency,

          status: order.status.toLowerCase(),

          createdAt: order.createdAt.toISOString(),

          paidAt:
            order.paidAt?.toISOString() ?? null,
        };
      },
    );

    // =======================================================================
    // TAUX
    // =======================================================================

    const paidOrderRate =
      totalOrders > 0
        ? roundToTwoDecimals(
            (paidOrders / totalOrders) * 100,
          )
        : 0;

    /*
     * Nombre moyen d'accès actifs par client.
     * Ce chiffre reste cohérent même si plusieurs devises
     * sont utilisées.
     */
    const averageEnrollmentsPerClient =
      totalClients > 0
        ? roundToTwoDecimals(
            activeEnrollments / totalClients,
          )
        : 0;

    // =======================================================================
    // RÉPONSE
    // =======================================================================

    return NextResponse.json(
      {
        success: true,

        generatedAt: now.toISOString(),

        overview: {
          clients: {
            total: totalClients,
            active: activeClients,
          },

          formations: {
            total: totalCourses,
            published: publishedCourses,
            draft: draftCourses,
          },

          orders: {
            total: totalOrders,
            paid: paidOrders,
            pending: pendingOrders,
            failed: failedOrders,
            cancelled: cancelledOrders,
            refunded: refundedOrders,
            paidRate: paidOrderRate,
          },

          enrollments: {
            active: activeEnrollments,
            averagePerClient:
              averageEnrollmentsPerClient,
          },

          payments: {
            paidCount: paidPayments.length,

            revenueByCurrency,

            currentMonthRevenueByCurrency,

            previousMonthRevenueByCurrency,
          },
        },

        revenue: {
          allTime: revenueByCurrency,

          currentMonth:
            currentMonthRevenueByCurrency,

          previousMonth:
            previousMonthRevenueByCurrency,

          chart: revenueChart,
        },

        topCourses,

        recentOrders: formattedRecentOrders,
      },
      {
        status: 200,
        headers: noStoreHeaders,
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_STATISTICS_GET_ERROR]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible de charger les statistiques administrateur.",
      },
      {
        status: 500,
        headers: noStoreHeaders,
      },
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

type AmountWithCurrency = {
  amount: number;
  currency: string;
};

type RevenuePayment = AmountWithCurrency & {
  paidAt: Date | null;
  createdAt: Date;
};

function aggregateAmountsByCurrency(
  values: AmountWithCurrency[],
) {
  const result: Record<string, number> = {};

  for (const value of values) {
    const currency =
      value.currency.trim().toUpperCase();

    if (!currency) {
      continue;
    }

    result[currency] =
      (result[currency] ?? 0) + value.amount;
  }

  return result;
}

function createRevenueChart(
  start: Date,
  payments: RevenuePayment[],
) {
  const months: Array<{
    key: string;
    label: string;
    year: number;
    month: number;
    revenueByCurrency: Record<string, number>;
  }> = [];

  for (let index = 0; index < 12; index += 1) {
    const date = new Date(
      start.getFullYear(),
      start.getMonth() + index,
      1,
    );

    months.push({
      key: createMonthKey(date),
      label: formatMonthLabel(date),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      revenueByCurrency: {},
    });
  }

  const monthMap = new Map(
    months.map((month) => [
      month.key,
      month,
    ]),
  );

  for (const payment of payments) {
    const paymentDate =
      payment.paidAt ?? payment.createdAt;

    const month = monthMap.get(
      createMonthKey(paymentDate),
    );

    if (!month) {
      continue;
    }

    const currency =
      payment.currency.trim().toUpperCase();

    if (!currency) {
      continue;
    }

    month.revenueByCurrency[currency] =
      (month.revenueByCurrency[currency] ?? 0) +
      payment.amount;
  }

  return months.map((month) => ({
    label: month.label,
    year: month.year,
    month: month.month,
    revenueByCurrency:
      month.revenueByCurrency,
  }));
}

function createMonthKey(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  return `${year}-${month}`;
}

function formatMonthLabel(date: Date) {
  const formatter = new Intl.DateTimeFormat(
    "fr-FR",
    {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    },
  );

  return formatter
    .format(
      new Date(
        Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          1,
        ),
      ),
    )
    .replace(".", "");
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

const noStoreHeaders = {
  "Cache-Control":
    "private, no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;
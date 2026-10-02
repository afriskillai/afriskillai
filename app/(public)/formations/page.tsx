import Image from "next/image";
import Link from "next/link";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * ============================================================================
 * AFRISKILL AI — PAGE PUBLIQUE DES FORMATIONS
 * ============================================================================
 *
 * Objectifs :
 * - afficher uniquement les formations publiées ;
 * - conserver la récupération Prisma existante ;
 * - proposer une grille professionnelle et responsive ;
 * - afficher 2 formations par ligne sur mobile ;
 * - afficher 3 formations par ligne sur grand écran ;
 * - renforcer fortement la lisibilité des titres ;
 * - rendre les prix et promotions immédiatement identifiables ;
 * - garantir la lisibilité du bouton d'accès à la formation ;
 * - conserver une interface compacte sur petit écran.
 * ============================================================================
 */

/**
 * ============================================================================
 * DONNÉES
 * ============================================================================
 */

async function getPublishedCourses() {
  return db.course.findMany({
    where: {
      status: "PUBLISHED",
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      title: true,
      shortDescription: true,
      price: true,
      promotionalPrice: true,
      currency: true,

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
    },
  });
}

/**
 * ============================================================================
 * PRIX
 * ============================================================================
 */

function formatPrice(
  value: number,
  currency: string,
): string {
  const safeValue = Number.isFinite(value)
    ? Math.max(0, value)
    : 0;

  const normalizedCurrency =
    currency.trim().toUpperCase() || "XOF";

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(safeValue);
  } catch {
    return `${safeValue.toLocaleString("fr-FR")} ${normalizedCurrency}`;
  }
}

/**
 * ============================================================================
 * ICONS
 * ============================================================================
 */

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M4 10h11M11 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M12 3.5c.65 4.05 2.45 5.85 6.5 6.5-4.05.65-5.85 2.45-6.5 6.5-.65-4.05-2.45-5.85-6.5-6.5 4.05-.65 5.85-2.45 6.5-6.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ============================================================================
 * PAGE
 * ============================================================================
 */

export default async function FormationsPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="min-h-[calc(100dvh-76px)] bg-[#F7F9FC]">
      {/*
       * ====================================================================
       * HERO
       * ====================================================================
       */}

      <section
        className="relative isolate overflow-hidden border-b border-white/10"
        style={{
          backgroundColor: "#061A40",
          color: "#FFFFFF",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-32 -z-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 right-0 -z-10 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
        />

        <div className="mx-auto max-w-[1440px] px-4 py-9 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] sm:text-xs"
            style={{
              color: "#CFFAFE",
              fontWeight: 900,
            }}
          >
            <SparkIcon />

            AfriSkill AI
          </span>

          <h1
            className="mt-4 text-[2rem] font-black leading-none tracking-[-0.045em] sm:mt-5 sm:text-4xl lg:text-[2.8rem]"
            style={{
              color: "#FFFFFF",
              fontWeight: 900,
            }}
          >
            Nos formations
          </h1>

          <p
            className="mt-3 max-w-2xl text-sm font-medium leading-6 sm:text-base sm:leading-7"
            style={{
              color: "#CBD5E1",
            }}
          >
            Découvrez les formations actuellement disponibles et
            développez des compétences pratiques autour de
            l&apos;intelligence artificielle.
          </p>
        </div>
      </section>

      {/*
       * ====================================================================
       * CATALOGUE
       * ====================================================================
       */}

      <section className="mx-auto max-w-[1440px] px-3 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        {/*
         * ==================================================================
         * COMPTEUR
         * ==================================================================
         */}

        <div className="mb-5 flex items-center justify-between gap-4 sm:mb-7">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0759D9]" />

            <p
              className="text-sm font-black"
              style={{
                color: "#071936",
                fontWeight: 900,
              }}
            >
              {courses.length} formation
              {courses.length > 1 ? "s" : ""} disponible
              {courses.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/*
         * ==================================================================
         * ÉTAT VIDE
         * ==================================================================
         */}

        {courses.length === 0 ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#061A40]">
              <Image
                src="/icon/icon.png"
                alt=""
                width={50}
                height={50}
                className="object-contain"
              />
            </div>

            <h2
              className="mt-5 text-xl font-black"
              style={{
                color: "#061A40",
                fontWeight: 900,
              }}
            >
              Aucune formation publiée pour le moment
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-slate-500">
              Les nouvelles formations apparaîtront ici dès leur
              publication.
            </p>
          </div>
        ) : (
          /*
           * =================================================================
           * GRILLE
           * =================================================================
           *
           * Mobile : 2 colonnes.
           * Tablette : 2 colonnes.
           * Desktop large : 3 colonnes.
           * =================================================================
           */

          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 xl:grid-cols-3">
            {courses.map((course) => {
              const price = Number(course.price);

              const promotionalPrice =
                course.promotionalPrice !== null
                  ? Number(course.promotionalPrice)
                  : null;

              const hasPromotion =
                promotionalPrice !== null &&
                Number.isFinite(promotionalPrice) &&
                promotionalPrice < price;

              const displayedPrice =
                hasPromotion && promotionalPrice !== null
                  ? promotionalPrice
                  : price;

              const imageUrl =
                course.images[0]?.url ?? null;

              const shortDescription =
                course.shortDescription?.trim() || null;

              return (
                <article
                  key={course.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-[1.15rem] border border-slate-200/90 bg-white shadow-[0_5px_20px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)] sm:rounded-[1.5rem]"
                >
                  {/*
                   * =========================================================
                   * IMAGE
                   * =========================================================
                   */}

                  <Link
                    href={`/formations/${course.id}`}
                    aria-label={`Voir la formation ${course.title}`}
                    className="relative block aspect-[16/10] overflow-hidden bg-[#071A35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={course.title}
                        fill
                        sizes="(max-width: 639px) 50vw, (max-width: 1279px) 50vw, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.025]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-5">
                        <Image
                          src="/icon/icon.png"
                          alt=""
                          width={90}
                          height={90}
                          className="h-auto w-[52px] object-contain opacity-80 sm:w-[90px]"
                        />
                      </div>
                    )}

                    {hasPromotion ? (
                      <span
                        className="absolute left-2 top-2 max-w-[calc(100%-1rem)] rounded-full bg-[#F5B400] px-2 py-1 text-[8px] font-black leading-tight shadow-lg sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[11px]"
                        style={{
                          color: "#061A40",
                          fontWeight: 900,
                        }}
                      >
                        Prix promotionnel
                      </span>
                    ) : null}

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#061A40]/20 to-transparent"
                    />
                  </Link>

                  {/*
                   * =========================================================
                   * CONTENU
                   * =========================================================
                   */}

                  <div className="flex flex-1 flex-col p-3 sm:p-5">
                    {/*
                     * =======================================================
                     * TITRE
                     * =======================================================
                     */}

                    <Link
                      href={`/formations/${course.id}`}
                      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <h2
                        className="line-clamp-2 break-words text-[15px] font-black leading-[1.18] tracking-[-0.025em] transition-colors group-hover:text-[#0759D9] sm:text-xl"
                        style={{
                          color: "#061A40",
                          fontWeight: 900,
                        }}
                      >
                        {course.title}
                      </h2>
                    </Link>

                    {/*
                     * =======================================================
                     * DESCRIPTION
                     * =======================================================
                     */}

                    {shortDescription ? (
                      <p
                        className="mt-2 line-clamp-2 text-[11px] font-medium leading-[1.55] sm:mt-3 sm:line-clamp-3 sm:text-sm sm:leading-6"
                        style={{
                          color: "#475569",
                        }}
                      >
                        {shortDescription}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] font-medium leading-5 text-slate-400 sm:mt-3 sm:text-sm">
                        Découvrez cette formation AfriSkill AI.
                      </p>
                    )}

                    {/*
                     * =======================================================
                     * PRIX + CTA
                     * =======================================================
                     */}

                    <div className="mt-auto pt-4 sm:pt-6">
                      <div className="border-t border-slate-100 pt-3 sm:pt-4">
                        <p
                          className="text-[9px] font-black uppercase tracking-[0.12em] sm:text-[11px]"
                          style={{
                            color: "#64748B",
                            fontWeight: 900,
                          }}
                        >
                          Formation
                        </p>

                        <div className="mt-1.5 min-w-0">
                          <p
                            className="break-words text-[15px] font-black leading-tight tracking-[-0.025em] sm:text-xl"
                            style={{
                              color: "#0B3B8F",
                              fontWeight: 900,
                            }}
                          >
                            {formatPrice(
                              displayedPrice,
                              course.currency,
                            )}
                          </p>

                          {hasPromotion ? (
                            <p
                              className="mt-1 text-[9px] font-semibold line-through sm:text-xs"
                              style={{
                                color: "#94A3B8",
                                textDecorationColor:
                                  "#94A3B8",
                              }}
                            >
                              {formatPrice(
                                price,
                                course.currency,
                              )}
                            </p>
                          ) : (
                            <div
                              aria-hidden="true"
                              className="h-[17px] sm:h-[21px]"
                            />
                          )}
                        </div>

                        {/*
                         * ===================================================
                         * BOUTON
                         * ===================================================
                         */}

                        <Link
                          href={`/formations/${course.id}`}
                          aria-label={`Voir la formation ${course.title}`}
                          className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#061A40] px-2 py-2.5 text-center text-[10px] font-black leading-tight shadow-[0_8px_20px_rgba(6,26,64,0.16)] transition duration-200 hover:bg-[#0B3B8F] hover:shadow-[0_10px_25px_rgba(11,59,143,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 sm:min-h-11 sm:gap-2 sm:px-4 sm:text-sm"
                          style={{
                            color: "#FFFFFF",
                            fontWeight: 900,
                          }}
                        >
                          <span
                            className="whitespace-nowrap"
                            style={{
                              color: "#FFFFFF",
                            }}
                          >
                            Voir la formation
                          </span>

                          <span
                            className="hidden sm:inline-flex"
                            style={{
                              color: "#FFFFFF",
                            }}
                          >
                            <ArrowIcon />
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
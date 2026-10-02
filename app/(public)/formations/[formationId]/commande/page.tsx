import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * ============================================================================
 * AFRISKILL AI — COMMANDE D'UNE FORMATION
 * ============================================================================
 *
 * Route :
 * /formations/[formationId]/commande
 *
 * Principes :
 * - formation et prix lus exclusivement depuis PostgreSQL ;
 * - aucun prix envoyé depuis le navigateur ;
 * - aucun PDF privé exposé ;
 * - aucun lien privé exposé ;
 * - formulaire simple : nom, e-mail, WhatsApp ;
 * - bouton de paiement fixe et toujours visible sur mobile ;
 * - barre de paiement placée AU-DESSUS de la navigation mobile AfriSkill ;
 * - bouton classique dans le formulaire sur desktop ;
 * - validation réelle du paiement exclusivement côté serveur.
 * ============================================================================
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CHECKOUT_FORM_ID = "formation-checkout-form";

/**
 * Hauteur réservée à la navigation mobile globale AfriSkill.
 *
 * La barre de paiement utilise cette valeur comme décalage depuis le bas
 * afin de ne jamais être cachée derrière la navigation mobile.
 */
const MOBILE_NAVIGATION_HEIGHT = "76px";

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */

type PageProps = {
  params: Promise<{
    formationId: string;
  }>;
};

type CheckoutCourse = {
  id: string;
  title: string;
  shortDescription: string | null;
  price: number;
  promotionalPrice: number | null;
  currency: string;
};

/**
 * ============================================================================
 * PRIX
 * ============================================================================
 */

function formatPrice(
  amount: number,
  currency: string,
): string {
  const normalizedCurrency = currency
    .trim()
    .toUpperCase();

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits:
        normalizedCurrency === "XOF" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(
      "fr-FR",
    )} ${normalizedCurrency}`;
  }
}

/**
 * ============================================================================
 * FORMATION
 * ============================================================================
 */

async function getCourse(
  formationId: string,
): Promise<CheckoutCourse | null> {
  const id = formationId.trim();

  if (!id) {
    return null;
  }

  return db.course.findFirst({
    where: {
      id,
      status: CourseStatus.PUBLISHED,
    },

    select: {
      id: true,
      title: true,
      shortDescription: true,
      price: true,
      promotionalPrice: true,
      currency: true,
    },
  });
}

/**
 * ============================================================================
 * METADATA
 * ============================================================================
 */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { formationId } = await params;

  const course = await getCourse(formationId);

  if (!course) {
    return {
      title: "Commande | AfriSkill AI",
    };
  }

  return {
    title: `Commander ${course.title} | AfriSkill AI`,
    description:
      `Finalisez votre commande pour accéder à la formation ${course.title}.`,
  };
}

/**
 * ============================================================================
 * ICÔNES
 * ============================================================================
 */

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M12 3 19 6V11.5C19 16.1 16.1 19.4 12 21C7.9 19.4 5 16.1 5 11.5V6L12 3Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9 12 11 14 15.5 9.5"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M4 6.5H20V17.5H4V6.5Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />

      <path
        d="M5 8 12 13 19 8"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth={1.8}
      />

      <path
        d="M8 10V7.5C8 5.3 9.8 3.5 12 3.5C14.2 3.5 16 5.3 16 7.5V10"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M19 12H5M11 18L5 12L11 6"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M5 12H19M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth={2.1}
        strokeLinecap="round"
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

export default async function FormationOrderPage({
  params,
}: PageProps) {
  const { formationId } = await params;

  const course = await getCourse(formationId);

  if (!course) {
    notFound();
  }

  /**
   * Le prix affiché est recalculé à partir des données serveur.
   *
   * Le navigateur ne décide jamais du montant réel du paiement.
   */
  const effectivePrice =
    course.promotionalPrice !== null
      ? course.promotionalPrice
      : course.price;

  const hasPromotion =
    course.promotionalPrice !== null &&
    course.promotionalPrice < course.price;

  const formattedPrice = formatPrice(
    effectivePrice,
    course.currency,
  );

  const formattedRegularPrice = hasPromotion
    ? formatPrice(
        course.price,
        course.currency,
      )
    : null;

  return (
    <>
      <main
        className="
          min-h-screen
          bg-[#f6f8fc]
          pb-[250px]
          pt-6
          sm:pb-[255px]
          sm:pt-10
          lg:pb-20
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-6xl
            px-4
            sm:px-6
            lg:px-8
          "
        >
          {/* ==============================================================
              RETOUR
              ============================================================== */}

          <div className="mb-5 sm:mb-7">
            <Link
              href={`/formations/${course.id}`}
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                font-bold
                text-[#334155]
                transition-colors
                duration-200
                hover:text-[#0f2b5b]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#2563eb]
                focus-visible:ring-offset-2
              "
            >
              <ArrowLeftIcon />

              <span>
                Retour à la formation
              </span>
            </Link>
          </div>

          {/* ==============================================================
              EN-TÊTE
              ============================================================== */}

          <section className="mb-7 text-center sm:mb-9">
            <div
              className="
                mx-auto
                mb-4
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-[#dbe4f0]
                bg-white
                px-4
                py-2
                text-xs
                font-black
                uppercase
                tracking-[0.12em]
                text-[#0f2b5b]
                shadow-sm
              "
            >
              <LockIcon />

              <span>
                Paiement sécurisé
              </span>
            </div>

            <h1
              className="
                mx-auto
                max-w-3xl
                text-[2rem]
                font-black
                leading-[1.02]
                tracking-[-0.045em]
                sm:text-[2.7rem]
                lg:text-[3.15rem]
              "
              style={{
                color: "#0f2b5b",
                fontWeight: 900,
              }}
            >
              Finalisez votre commande
            </h1>

            <p
              className="
                mx-auto
                mt-4
                max-w-2xl
                text-sm
                font-medium
                leading-6
                text-[#64748b]
                sm:text-base
                sm:leading-7
              "
            >
              Entrez vos informations puis payez votre
              formation. Après confirmation du paiement,
              votre accès sera envoyé à votre adresse
              e-mail.
            </p>
          </section>

          {/* ==============================================================
              CONTENU PRINCIPAL
              ============================================================== */}

          <div
            className="
              grid
              gap-6
              lg:grid-cols-[minmax(0,1fr)_360px]
              lg:items-start
            "
          >
            {/* ============================================================
                FORMULAIRE
                ============================================================ */}

            <section
              className="
                overflow-hidden
                rounded-[26px]
                border
                border-[#e2e8f0]
                bg-white
                shadow-[0_20px_55px_rgba(15,43,91,0.08)]
                sm:rounded-[30px]
              "
            >
              <div
                className="
                  border-b
                  border-[#edf1f7]
                  px-5
                  py-5
                  sm:px-7
                  sm:py-6
                "
              >
                <p
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.14em]
                    text-[#2563eb]
                  "
                >
                  Vos informations
                </p>

                <h2
                  className="
                    mt-2
                    text-xl
                    font-black
                    tracking-[-0.025em]
                    sm:text-2xl
                  "
                  style={{
                    color: "#0f2b5b",
                    fontWeight: 900,
                  }}
                >
                  Informations de commande
                </h2>

                <p
                  className="
                    mt-2
                    max-w-xl
                    text-sm
                    leading-6
                    text-[#64748b]
                  "
                >
                  Utilisez une adresse e-mail que vous
                  consultez. Votre formation sera envoyée
                  à cette adresse après confirmation du
                  paiement.
                </p>
              </div>

              {/* ==========================================================
                  FORMULAIRE CHECKOUT

                  Le navigateur transmet :
                  - courseId
                  - firstName
                  - email
                  - whatsapp

                  Il ne transmet :
                  - ni prix ;
                  - ni PDF privé ;
                  - ni lien privé.
                  ========================================================== */}

              <form
                id={CHECKOUT_FORM_ID}
                action="/api/checkout"
                method="post"
                className="
                  space-y-5
                  px-5
                  py-6
                  sm:px-7
                  sm:py-7
                "
              >
                <input
                  type="hidden"
                  name="courseId"
                  value={course.id}
                />

                {/* ========================================================
                    NOM
                    ======================================================== */}

                <div>
                  <label
                    htmlFor="firstName"
                    className="
                      mb-2
                      block
                      text-sm
                      font-extrabold
                      text-[#172033]
                    "
                  >
                    Votre nom
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={100}
                    placeholder="Exemple : Jean"
                    className="
                      h-14
                      w-full
                      rounded-2xl
                      border
                      border-[#cbd5e1]
                      bg-white
                      px-4
                      text-base
                      font-semibold
                      text-[#172033]
                      outline-none
                      transition
                      placeholder:font-medium
                      placeholder:text-[#94a3b8]
                      focus:border-[#2563eb]
                      focus:ring-4
                      focus:ring-[#2563eb]/10
                    "
                  />
                </div>

                {/* ========================================================
                    EMAIL
                    ======================================================== */}

                <div>
                  <label
                    htmlFor="email"
                    className="
                      mb-2
                      block
                      text-sm
                      font-extrabold
                      text-[#172033]
                    "
                  >
                    Votre adresse e-mail
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    maxLength={320}
                    placeholder="exemple@email.com"
                    className="
                      h-14
                      w-full
                      rounded-2xl
                      border
                      border-[#cbd5e1]
                      bg-white
                      px-4
                      text-base
                      font-semibold
                      text-[#172033]
                      outline-none
                      transition
                      placeholder:font-medium
                      placeholder:text-[#94a3b8]
                      focus:border-[#2563eb]
                      focus:ring-4
                      focus:ring-[#2563eb]/10
                    "
                  />

                  <p
                    className="
                      mt-2
                      text-xs
                      font-medium
                      leading-5
                      text-[#64748b]
                    "
                  >
                    Vérifiez bien cette adresse : votre
                    accès à la formation y sera envoyé.
                  </p>
                </div>

                {/* ========================================================
                    WHATSAPP
                    ======================================================== */}

                <div>
                  <label
                    htmlFor="whatsapp"
                    className="
                      mb-2
                      block
                      text-sm
                      font-extrabold
                      text-[#172033]
                    "
                  >
                    Votre numéro WhatsApp
                  </label>

                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    maxLength={50}
                    placeholder="+229 01 00 00 00 00"
                    className="
                      h-14
                      w-full
                      rounded-2xl
                      border
                      border-[#cbd5e1]
                      bg-white
                      px-4
                      text-base
                      font-semibold
                      text-[#172033]
                      outline-none
                      transition
                      placeholder:font-medium
                      placeholder:text-[#94a3b8]
                      focus:border-[#2563eb]
                      focus:ring-4
                      focus:ring-[#2563eb]/10
                    "
                  />

                  <p
                    className="
                      mt-2
                      text-xs
                      font-medium
                      leading-5
                      text-[#64748b]
                    "
                  >
                    Ajoutez l’indicatif de votre pays.
                    Exemple : +229, +33, +225.
                  </p>
                </div>

                {/* ========================================================
                    MONTANT — MOBILE
                    ======================================================== */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-[#dbe4f0]
                    bg-[#f8fafc]
                    p-4
                    lg:hidden
                  "
                >
                  <p
                    className="
                      text-xs
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-[#64748b]
                    "
                  >
                    Montant à payer
                  </p>

                  <div
                    className="
                      mt-2
                      flex
                      flex-wrap
                      items-end
                      gap-x-3
                      gap-y-1
                    "
                  >
                    <strong
                      className="
                        text-2xl
                        font-black
                        tracking-[-0.035em]
                      "
                      style={{
                        color: "#0f2b5b",
                        fontWeight: 900,
                      }}
                    >
                      {formattedPrice}
                    </strong>

                    {formattedRegularPrice ? (
                      <span
                        className="
                          pb-0.5
                          text-sm
                          font-bold
                          text-[#94a3b8]
                          line-through
                        "
                      >
                        {formattedRegularPrice}
                      </span>
                    ) : null}
                  </div>

                  {hasPromotion ? (
                    <div
                      className="
                        mt-3
                        inline-flex
                        rounded-full
                        bg-[#ecfdf3]
                        px-3
                        py-1.5
                        text-xs
                        font-black
                        text-[#15803d]
                      "
                    >
                      Prix promotionnel appliqué
                    </div>
                  ) : null}
                </div>

                {/* ========================================================
                    BOUTON DE PAIEMENT — DESKTOP UNIQUEMENT
                    ======================================================== */}

                <button
                  type="submit"
                  aria-label={`Payer ${formattedPrice}`}
                  className="
                    hidden
                    min-h-[68px]
                    w-full
                    cursor-pointer
                    items-center
                    justify-center
                    gap-3
                    rounded-2xl
                    border-2
                    border-[#0f2b5b]
                    bg-[#0f2b5b]
                    px-5
                    py-4
                    text-center
                    shadow-[0_16px_34px_rgba(15,43,91,0.28)]
                    transition
                    duration-200
                    hover:border-[#173b75]
                    hover:bg-[#173b75]
                    hover:shadow-[0_18px_38px_rgba(15,43,91,0.34)]
                    focus-visible:outline-none
                    focus-visible:ring-4
                    focus-visible:ring-[#2563eb]/25
                    active:translate-y-[1px]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    lg:flex
                  "
                  style={{
                    backgroundColor: "#0f2b5b",
                    borderColor: "#0f2b5b",
                    color: "#ffffff",
                  }}
                >
                  <span
                    className="
                      text-lg
                      font-black
                      leading-tight
                    "
                    style={{
                      color: "#ffffff",
                      fontWeight: 900,
                    }}
                  >
                    Payer {formattedPrice}
                  </span>

                  <span
                    aria-hidden="true"
                    className="shrink-0"
                    style={{
                      color: "#ffffff",
                    }}
                  >
                    <ArrowRightIcon />
                  </span>
                </button>

                {/* ========================================================
                    INFORMATION SÉCURITÉ
                    ======================================================== */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-[#dbeafe]
                    bg-[#eff6ff]
                    px-4
                    py-4
                  "
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="
                        mt-0.5
                        shrink-0
                        text-[#2563eb]
                      "
                    >
                      <ShieldIcon />
                    </span>

                    <div>
                      <p
                        className="
                          text-sm
                          font-black
                          text-[#172033]
                        "
                      >
                        Paiement sécurisé
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          font-semibold
                          leading-5
                          text-[#475569]
                          sm:text-sm
                        "
                      >
                        Votre formation est envoyée
                        uniquement après confirmation du
                        paiement.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </section>

            {/* ============================================================
                RÉCAPITULATIF — DESKTOP
                ============================================================ */}

            <aside
              className="
                hidden
                lg:sticky
                lg:top-24
                lg:block
              "
            >
              <div
                className="
                  overflow-hidden
                  rounded-[28px]
                  border
                  border-[#e2e8f0]
                  bg-white
                  shadow-[0_20px_55px_rgba(15,43,91,0.08)]
                "
              >
                {/* ========================================================
                    TITRE FORMATION
                    ======================================================== */}

                <div
                  className="
                    bg-[#0f2b5b]
                    px-6
                    py-6
                  "
                  style={{
                    backgroundColor: "#0f2b5b",
                  }}
                >
                  <p
                    className="
                      text-xs
                      font-black
                      uppercase
                      tracking-[0.14em]
                    "
                    style={{
                      color: "rgba(255,255,255,0.78)",
                    }}
                  >
                    Votre commande
                  </p>

                  <h2
                    className="
                      mt-2
                      text-xl
                      font-black
                      leading-tight
                      tracking-[-0.025em]
                    "
                    style={{
                      color: "#ffffff",
                      fontWeight: 900,
                    }}
                  >
                    {course.title}
                  </h2>
                </div>

                <div className="p-6">
                  {course.shortDescription ? (
                    <p
                      className="
                        line-clamp-3
                        text-sm
                        font-medium
                        leading-6
                        text-[#475569]
                      "
                    >
                      {course.shortDescription}
                    </p>
                  ) : null}

                  <div className="my-5 h-px bg-[#e8edf4]" />

                  {/* ======================================================
                      PRIX
                      ====================================================== */}

                  <p
                    className="
                      text-xs
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-[#64748b]
                    "
                  >
                    Montant à payer
                  </p>

                  <div
                    className="
                      mt-2
                      flex
                      items-end
                      justify-between
                      gap-4
                    "
                  >
                    <span
                      className="
                        text-sm
                        font-bold
                        text-[#64748b]
                      "
                    >
                      Total
                    </span>

                    <div className="text-right">
                      {formattedRegularPrice ? (
                        <p
                          className="
                            mb-0.5
                            text-sm
                            font-bold
                            text-[#94a3b8]
                            line-through
                          "
                        >
                          {formattedRegularPrice}
                        </p>
                      ) : null}

                      <strong
                        className="
                          text-2xl
                          font-black
                          tracking-[-0.035em]
                        "
                        style={{
                          color: "#0f2b5b",
                          fontWeight: 900,
                        }}
                      >
                        {formattedPrice}
                      </strong>
                    </div>
                  </div>

                  {hasPromotion ? (
                    <div
                      className="
                        mt-4
                        inline-flex
                        rounded-full
                        bg-[#ecfdf3]
                        px-3
                        py-1.5
                        text-xs
                        font-black
                        text-[#15803d]
                      "
                    >
                      Prix promotionnel appliqué
                    </div>
                  ) : null}

                  {/* ======================================================
                      GARANTIES
                      ====================================================== */}

                  <div
                    className="
                      mt-6
                      space-y-5
                      border-t
                      border-[#e8edf4]
                      pt-5
                    "
                  >
                    {/* PAIEMENT */}

                    <div className="flex items-start gap-3">
                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[#eff6ff]
                          text-[#2563eb]
                        "
                      >
                        <ShieldIcon />
                      </div>

                      <div>
                        <p
                          className="
                            text-sm
                            font-black
                            text-[#172033]
                          "
                        >
                          Paiement sécurisé
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-[#64748b]
                          "
                        >
                          Le paiement est vérifié avant
                          l’envoi de votre formation.
                        </p>
                      </div>
                    </div>

                    {/* EMAIL */}

                    <div className="flex items-start gap-3">
                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[#f0fdf4]
                          text-[#15803d]
                        "
                      >
                        <MailIcon />
                      </div>

                      <div>
                        <p
                          className="
                            text-sm
                            font-black
                            text-[#172033]
                          "
                        >
                          Formation envoyée par e-mail
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-[#64748b]
                          "
                        >
                          Après confirmation du paiement,
                          vous recevez les informations
                          permettant d’accéder à votre
                          formation.
                        </p>
                      </div>
                    </div>

                    {/* CONTENU PRIVÉ */}

                    <div className="flex items-start gap-3">
                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[#fff7ed]
                          text-[#c76b16]
                        "
                      >
                        <LockIcon />
                      </div>

                      <div>
                        <p
                          className="
                            text-sm
                            font-black
                            text-[#172033]
                          "
                        >
                          Votre accès est protégé
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-[#64748b]
                          "
                        >
                          Le PDF et le lien privé ne sont
                          délivrés qu’après confirmation du
                          paiement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* ==============================================================
              AIDE
              ============================================================== */}

          <section
            className="
              mx-auto
              mt-8
              max-w-3xl
              text-center
              sm:mt-10
            "
          >
            <p
              className="
                text-sm
                font-medium
                leading-6
                text-[#64748b]
              "
            >
              Une question avant de payer ?{" "}

              <a
                href="mailto:contact@afriskill-ai.com"
                className="
                  font-black
                  text-[#0f2b5b]
                  underline
                  decoration-[#cbd5e1]
                  underline-offset-4
                  transition
                  hover:text-[#2563eb]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#2563eb]
                "
              >
                contact@afriskill-ai.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* ==================================================================
          BARRE DE PAIEMENT FIXE — MOBILE / TABLETTE
          ==================================================================
          
          Cette barre reste visible pendant tout le scroll.

          Elle n'est PAS placée à bottom-0 :
          la navigation mobile AfriSkill occupe déjà le bas de l'écran.

          Ordre visuel :
          
          1. contenu de la page
          2. barre "Total + Payer maintenant"
          3. navigation mobile AfriSkill
          
          Le bouton est visuellement hors du formulaire, mais l'attribut
          form={CHECKOUT_FORM_ID} le rattache au formulaire HTML.
          
          Les champs required continuent donc d'être contrôlés avant
          soumission.
          ================================================================== */}

      <div
        className="
          fixed
          inset-x-0
          z-[70]
          border-t
          border-[#dbe3ef]
          bg-white
          px-3
          py-3
          shadow-[0_-12px_32px_rgba(15,43,91,0.16)]
          lg:hidden
        "
        style={{
          bottom: `calc(${MOBILE_NAVIGATION_HEIGHT} + env(safe-area-inset-bottom))`,
        }}
      >
        <div
          className="
            mx-auto
            w-full
            max-w-2xl
          "
        >
          <div
            className="
              flex
              w-full
              items-center
              gap-3
            "
          >
            {/* ============================================================
                TOTAL
                ============================================================ */}

            <div
              className="
                min-w-[108px]
                shrink-0
              "
            >
              <p
                className="
                  text-[10px]
                  font-black
                  uppercase
                  leading-none
                  tracking-[0.08em]
                  text-[#64748b]
                "
              >
                Total à payer
              </p>

              <p
                className="
                  mt-1.5
                  whitespace-nowrap
                  text-[16px]
                  font-black
                  leading-none
                  tracking-[-0.025em]
                  sm:text-lg
                "
                style={{
                  color: "#0f2b5b",
                  fontWeight: 900,
                }}
              >
                {formattedPrice}
              </p>

              {formattedRegularPrice ? (
                <p
                  className="
                    mt-1
                    whitespace-nowrap
                    text-[10px]
                    font-bold
                    leading-none
                    text-[#94a3b8]
                    line-through
                  "
                >
                  {formattedRegularPrice}
                </p>
              ) : null}
            </div>

            {/* ============================================================
                BOUTON FIXE
                ============================================================ */}

            <button
              type="submit"
              form={CHECKOUT_FORM_ID}
              aria-label={`Payer ${formattedPrice}`}
              className="
                flex
                min-h-[60px]
                min-w-0
                flex-1
                cursor-pointer
                items-center
                justify-center
                gap-2
                rounded-2xl
                border-2
                border-[#0f2b5b]
                bg-[#0f2b5b]
                px-3
                py-3
                text-center
                shadow-[0_10px_26px_rgba(15,43,91,0.26)]
                transition
                duration-200
                focus-visible:outline-none
                focus-visible:ring-4
                focus-visible:ring-[#2563eb]/25
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:px-5
              "
              style={{
                backgroundColor: "#0f2b5b",
                borderColor: "#0f2b5b",
                color: "#ffffff",
              }}
            >
              <span
                className="
                  whitespace-nowrap
                  text-[15px]
                  font-black
                  leading-none
                  sm:text-base
                "
                style={{
                  color: "#ffffff",
                  fontWeight: 900,
                }}
              >
                Payer maintenant
              </span>

              <span
                aria-hidden="true"
                className="shrink-0"
                style={{
                  color: "#ffffff",
                }}
              >
                <ArrowRightIcon />
              </span>
            </button>
          </div>

          {/* ==============================================================
              MESSAGE DE CONFIANCE
              ============================================================== */}

          <div
            className="
              mt-2
              flex
              items-center
              justify-center
              gap-1.5
              text-center
            "
          >
            <span
              aria-hidden="true"
              className="
                inline-flex
                shrink-0
                text-[#15803d]
              "
            >
              <ShieldIcon />
            </span>

            <p
              className="
                text-[10px]
                font-bold
                leading-tight
                text-[#475569]
                sm:text-xs
              "
            >
              Paiement sécurisé • Accès après confirmation
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import { useId, useState } from "react";

/**
 * ============================================================================
 * AFRISKILL AI — FORMATION FAQ
 * ============================================================================
 *
 * FAQ interactive utilisée sur la page publique d'une formation.
 *
 * Objectifs :
 * - rassurer le client avant la commande ;
 * - expliquer clairement le paiement ;
 * - expliquer la livraison automatique après paiement confirmé ;
 * - expliquer l'accès depuis le compte AfriSkill AI ;
 * - expliquer l'envoi automatique du lien par e-mail ;
 * - expliquer l'envoi du PDF associé à la formation ;
 * - proposer un contact direct WhatsApp et e-mail ;
 * - conserver une interface premium, accessible et responsive.
 *
 * Architecture :
 * - composant client autonome ;
 * - une seule question ouverte à la fois ;
 * - aucune dépendance externe ;
 * - aucun accès Prisma ;
 * - aucune logique de paiement ;
 * - aucune logique d'envoi d'e-mail ;
 * - aucun état métier modifié.
 * ============================================================================
 */

type FormationFaqItem = {
  id: string;
  question: string;
  answer: string;
};

type FormationFaqProps = {
  className?: string;
};

/**
 * ============================================================================
 * CONTACT
 * ============================================================================
 */

const WHATSAPP_NUMBER = "33757750473";
const WHATSAPP_DISPLAY = "+33 7 57 75 04 73";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const CONTACT_EMAIL = "contact@afriskill-ai.com";
const CONTACT_EMAIL_URL = `mailto:${CONTACT_EMAIL}`;

/**
 * ============================================================================
 * CONTENU FAQ
 * ============================================================================
 */

const FAQ_ITEMS: readonly FormationFaqItem[] = [
  {
    id: "formation-delivery",
    question:
      "Comment vais-je recevoir ma formation après le paiement ?",
    answer:
      "Dès que votre paiement est confirmé, votre commande est validée automatiquement et votre accès à la formation est activé. Les informations prévues pour votre achat sont également envoyées automatiquement par e-mail.",
  },
  {
    id: "automatic-access",
    question:
      "L'accès à la formation est-il automatique ?",
    answer:
      "Oui. Après confirmation effective du paiement, l'accès à la formation est activé automatiquement sur votre compte AfriSkill AI. Vous n'avez normalement pas besoin d'attendre une validation manuelle.",
  },
  {
    id: "email-link",
    question:
      "Est-ce que je reçois aussi le lien de la formation par e-mail ?",
    answer:
      "Oui. Après validation du paiement, un e-mail est envoyé automatiquement avec les informations de votre commande ainsi que le lien prévu pour accéder à votre formation.",
  },
  {
    id: "formation-pdf",
    question:
      "Est-ce que je reçois également un PDF après mon achat ?",
    answer:
      "Oui. Après confirmation du paiement, vous recevez également le PDF associé à la formation. Ce document contient les informations prévues pour accompagner votre formation.",
  },
  {
    id: "order-content",
    question:
      "Que contient exactement ma commande ?",
    answer:
      "Après confirmation du paiement, votre commande comprend l'accès complet à la formation achetée, le lien d'accès prévu pour cette formation ainsi que le PDF associé à la formation.",
  },
  {
    id: "delivery-time",
    question:
      "Combien de temps faut-il pour recevoir la formation ?",
    answer:
      "La délivrance est automatique après la confirmation effective du paiement. Dès que le système reçoit la confirmation du paiement, l'accès et les éléments prévus pour la formation peuvent être délivrés automatiquement.",
  },
  {
    id: "manual-contact",
    question:
      "Dois-je contacter AfriSkill AI après avoir payé ?",
    answer:
      "Non. Dans le fonctionnement normal, aucune intervention manuelle n'est nécessaire. Le système traite automatiquement la confirmation du paiement et la délivrance des éléments associés à votre formation.",
  },
  {
    id: "account-access",
    question:
      "Où puis-je retrouver ma formation après l'achat ?",
    answer:
      "Votre accès est associé au compte utilisé pour effectuer la commande. Vous pouvez ainsi retrouver votre formation depuis votre espace personnel AfriSkill AI, en complément des informations envoyées par e-mail.",
  },
  {
    id: "payment-pending",
    question:
      "Que se passe-t-il si mon paiement est en attente ou n'est pas confirmé ?",
    answer:
      "La formation est délivrée après confirmation effective du paiement. Si le paiement reste en attente, est interrompu ou échoue, l'accès automatique n'est pas activé comme pour une commande dont le paiement a été confirmé.",
  },
  {
    id: "personal-access",
    question:
      "L'accès à ma formation est-il personnel ?",
    answer:
      "Oui. L'accès à une formation achetée est associé au compte utilisé lors de la commande. Votre compte permet de centraliser et de sécuriser l'accès à votre formation.",
  },
];

/**
 * ============================================================================
 * UTILITAIRES
 * ============================================================================
 */

function joinClassNames(
  ...values: Array<string | null | undefined | false>
): string {
  return values.filter(Boolean).join(" ");
}

/**
 * ============================================================================
 * ICONS
 * ============================================================================
 */

function QuestionIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M9.7 9.25a2.55 2.55 0 0 1 4.85 1.1c0 1.9-2.55 2.1-2.55 3.65"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M12 17.2h.01"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={joinClassNames(
        "h-5 w-5 transition-transform duration-300 ease-out",
        open && "rotate-180",
      )}
    >
      <path
        d="m5.5 7.5 4.5 4.5 4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M4.5 10.25 8.1 13.8 15.6 6.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="m13.5 2.8-7 10.1h5.2l-1.2 8.3 7-10.1h-5.2l1.2-8.3Z"
        stroke="currentColor"
        strokeWidth="1.8"
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
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="m5 8 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M14 3.8V8h4.2M9 12h6M9 15.5h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      <path
        d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L4 20l1.1-4a8.2 8.2 0 1 1 15.1-4.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9 8.2c.2-.45.42-.46.67-.46h.57c.18 0 .36.02.5.38l.72 1.72c.1.25.06.46-.1.67l-.52.64c-.16.18-.14.35-.03.54.55.94 1.3 1.7 2.23 2.27.2.12.38.13.55-.05l.68-.78c.2-.23.4-.28.68-.16l1.63.77c.28.13.47.2.54.33.08.13.08.76-.17 1.38-.25.61-1.45 1.17-2.02 1.24-.53.06-1.2.1-1.94-.14-.45-.15-1.03-.34-1.77-.66-3.12-1.35-5.15-4.5-5.3-4.71-.15-.2-1.27-1.69-1.27-3.22 0-1.54.8-2.29 1.09-2.6Z"
        transform="translate(1.4 1.2) scale(.82)"
        fill="currentColor"
      />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      <path
        d="M4 13v-1a8 8 0 0 1 16 0v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M5 12h1.5A1.5 1.5 0 0 1 8 13.5v3A1.5 1.5 0 0 1 6.5 18H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1ZM19 12h-1.5a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 1.5 1.5H19a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M16.5 18c-.6 1.35-1.7 2-3.5 2h-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
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

/**
 * ============================================================================
 * CARTE RÉASSURANCE
 * ============================================================================
 */

function ReassuranceItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className="text-sm font-black leading-5"
          style={{
            color: "#071936",
          }}
        >
          {title}
        </p>

        <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * QUESTION / RÉPONSE
 * ============================================================================
 */

function FaqItem({
  item,
  open,
  onToggle,
  instanceId,
}: {
  item: FormationFaqItem;
  open: boolean;
  onToggle: () => void;
  instanceId: string;
}) {
  const buttonId =
    `${instanceId}-${item.id}-button`;

  const panelId =
    `${instanceId}-${item.id}-panel`;

  return (
    <div
      className={joinClassNames(
        "overflow-hidden rounded-2xl border bg-white transition-all duration-300",
        open
          ? "border-blue-200 shadow-[0_14px_35px_rgba(15,23,42,0.08)] ring-1 ring-blue-100"
          : "border-slate-200 shadow-[0_5px_18px_rgba(15,23,42,0.035)] hover:border-blue-200 hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]",
      )}
    >
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="group flex w-full items-center gap-4 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 sm:px-5 sm:py-5"
        >
          <span
            className={joinClassNames(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300",
              open
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-slate-50 text-blue-700 group-hover:border-blue-100 group-hover:bg-blue-50",
            )}
          >
            <QuestionIcon />
          </span>

          <span
            className="min-w-0 flex-1 text-[15px] font-black leading-6 sm:text-base"
            style={{
              color: "#071936",
              fontWeight: 900,
            }}
          >
            {item.question}
          </span>

          <span
            className={joinClassNames(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
              open
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 group-hover:border-blue-200 group-hover:text-blue-700",
            )}
          >
            <ChevronIcon open={open} />
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
      >
        <div className="px-4 pb-5 sm:px-5 sm:pb-6">
          <div className="ml-0 border-t border-slate-100 pt-4 sm:ml-[3.25rem]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <CheckIcon />
              </span>

              <p className="max-w-4xl text-sm font-medium leading-7 text-slate-700 sm:text-[15px]">
                {item.answer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * CONTACT
 * ============================================================================
 */

function ContactSection() {
  return (
    <div className="mx-auto mt-10 max-w-5xl sm:mt-12">
      <div className="relative isolate overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0759D9] via-[#1685F8] to-[#F5AA00]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-20 -z-10 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-16 -z-10 h-64 w-64 rounded-full bg-amber-100/60 blur-3xl"
        />

        <div className="p-5 pt-7 sm:p-7 sm:pt-9 lg:p-8 lg:pt-10">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-10">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                <SupportIcon />
                Besoin d'aide ?
              </div>

              <h3
                className="mt-4 max-w-xl text-2xl font-black leading-tight tracking-[-0.04em] sm:text-[1.8rem]"
                style={{
                  color: "#071936",
                  fontWeight: 900,
                }}
              >
                Une question avant ou après votre commande ?
              </h3>

              <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
                L'équipe AfriSkill AI reste disponible pour vous
                accompagner concernant une formation, votre paiement
                ou l'accès à votre contenu après votre achat.
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <CheckIcon />
                </span>

                <span>
                  Choisissez simplement le canal qui vous convient.
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Contacter AfriSkill AI sur WhatsApp au ${WHATSAPP_DISPLAY}`}
                className="group relative overflow-hidden rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100/70 hover:shadow-[0_14px_35px_rgba(5,150,105,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-[0_10px_25px_rgba(37,211,102,0.22)]">
                    <WhatsAppIcon />
                  </span>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowIcon />
                  </span>
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                  WhatsApp
                </p>

                <p
                  className="mt-1.5 break-words text-base font-black leading-6"
                  style={{
                    color: "#071936",
                    fontWeight: 900,
                  }}
                >
                  {WHATSAPP_DISPLAY}
                </p>

                <p className="mt-2 text-xs font-medium leading-5 text-slate-600">
                  Écrivez-nous directement sur WhatsApp.
                </p>
              </a>

              <a
                href={CONTACT_EMAIL_URL}
                aria-label={`Envoyer un e-mail à ${CONTACT_EMAIL}`}
                className="group relative overflow-hidden rounded-[1.4rem] border border-blue-200 bg-blue-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100/70 hover:shadow-[0_14px_35px_rgba(7,89,217,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0759D9] text-white shadow-[0_10px_25px_rgba(7,89,217,0.22)]">
                    <MailIcon />
                  </span>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700 transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowIcon />
                  </span>
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                  E-mail
                </p>

                <p
                  className="mt-1.5 break-all text-base font-black leading-6"
                  style={{
                    color: "#071936",
                    fontWeight: 900,
                  }}
                >
                  {CONTACT_EMAIL}
                </p>

                <p className="mt-2 text-xs font-medium leading-5 text-slate-600">
                  Envoyez-nous votre demande par e-mail.
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * FAQ
 * ============================================================================
 */

export default function FormationFaq({
  className,
}: FormationFaqProps) {
  const instanceId = useId();

  const [openItemId, setOpenItemId] =
    useState<string | null>(null);

  function handleToggle(itemId: string) {
    setOpenItemId((currentItemId) =>
      currentItemId === itemId
        ? null
        : itemId,
    );
  }

  return (
    <section
      aria-labelledby={`${instanceId}-title`}
      className={joinClassNames(
        "relative overflow-hidden",
        className,
      )}
    >
      {/*
       * ================================================================
       * DÉCORATION D'ARRIÈRE-PLAN
       * ================================================================
       */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl">
        {/*
         * ================================================================
         * EN-TÊTE
         * ================================================================
         */}

        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
            <span className="flex h-5 w-5 items-center justify-center">
              <QuestionIcon />
            </span>

            Questions fréquentes
          </div>

          <h2
            id={`${instanceId}-title`}
            className="mt-5 text-[2rem] font-black leading-[1.05] tracking-[-0.045em] sm:text-[2.6rem] lg:text-[3rem]"
            style={{
              color: "#071936",
              fontWeight: 900,
            }}
          >
            Tout savoir avant de commander votre formation
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
            Retrouvez les réponses aux principales questions concernant
            le paiement, l&apos;activation de votre accès et la réception
            automatique de votre formation.
          </p>
        </div>

        {/*
         * ================================================================
         * RÉASSURANCE
         * ================================================================
         */}

        <div className="mx-auto mt-8 grid max-w-5xl gap-3 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:grid-cols-3 sm:gap-5 sm:p-5">
          <ReassuranceItem
            icon={<LightningIcon />}
            title="Activation automatique"
            description="L'accès est activé après confirmation du paiement."
          />

          <ReassuranceItem
            icon={<MailIcon />}
            title="Envoi par e-mail"
            description="Les informations prévues sont envoyées automatiquement."
          />

          <ReassuranceItem
            icon={<DocumentIcon />}
            title="Lien et PDF"
            description="Le lien d'accès et le PDF associé accompagnent votre formation."
          />
        </div>

        {/*
         * ================================================================
         * QUESTIONS
         * ================================================================
         */}

        <div className="mx-auto mt-8 max-w-4xl space-y-3 sm:mt-10 sm:space-y-4">
          {FAQ_ITEMS.map((item) => (
            <FaqItem
              key={item.id}
              item={item}
              instanceId={instanceId}
              open={openItemId === item.id}
              onToggle={() =>
                handleToggle(item.id)
              }
            />
          ))}
        </div>

        {/*
         * ================================================================
         * NOTE FINALE
         * ================================================================
         */}

        <div className="mx-auto mt-8 max-w-4xl sm:mt-10">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-blue-100 bg-[linear-gradient(135deg,#f5f9ff_0%,#ffffff_58%,#fff9e9_100%)] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#071936] text-white shadow-[0_10px_25px_rgba(7,25,54,0.18)]">
                <CheckIcon />
              </span>

              <div className="min-w-0">
                <p
                  className="text-base font-black leading-6 sm:text-lg"
                  style={{
                    color: "#071936",
                    fontWeight: 900,
                  }}
                >
                  Une expérience pensée pour être simple
                </p>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  Une fois le paiement confirmé, AfriSkill AI peut
                  automatiser l&apos;activation de votre accès et
                  l&apos;envoi des éléments associés à votre formation,
                  afin de limiter les étapes manuelles après votre
                  commande.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/*
         * ================================================================
         * CONTACT
         * ================================================================
         */}

        <ContactSection />
      </div>
    </section>
  );
}
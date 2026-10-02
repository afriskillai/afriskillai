"use client";

import Link from "next/link";

import { useCart } from "@/components/cart/CartProvider";

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-8 w-8"
    >
      <path
        d="M3 4h2l1.7 9.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 7H6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 20h.01M18 20h.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function PanierPage() {
  const {
    items,
    itemCount,
    isHydrated,
    removeCourse,
    clearCart,
  } = useCart();

  if (!isHydrated) {
    return (
      <div className="min-h-[70dvh] bg-[#F7F9FC]">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-76px)] bg-[#F7F9FC]">
      <section className="bg-[#061A40] text-white">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F5B400]">
            AfriSkill AI
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Mon panier
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            {itemCount} formation
            {itemCount > 1 ? "s" : ""} sélectionnée
            {itemCount > 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#061A40] text-cyan-300">
              <CartIcon />
            </div>

            <h2 className="mt-5 text-xl font-black text-[#061A40]">
              Votre panier est vide
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Découvrez les formations AfriSkill AI et ajoutez
              celles qui correspondent à vos objectifs.
            </p>

            <Link
              href="/formations"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#F5B400] px-6 py-3 text-sm font-black text-[#061A40] transition hover:bg-[#FFD45C]"
            >
              Découvrir les formations
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-3">
              {items.map((item, index) => (
                <article
                  key={item.courseId}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0B3B8F]">
                      Formation {index + 1}
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-[#061A40]">
                      Référence : {item.courseId}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeCourse(item.courseId)
                    }
                    className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    Retirer
                  </button>
                </article>
              ))}
            </div>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-[#061A40]">
                Récapitulatif
              </h2>

              <div className="mt-5 flex items-center justify-between border-b border-slate-100 pb-4 text-sm">
                <span className="text-slate-600">
                  Formations
                </span>

                <span className="font-black text-[#061A40]">
                  {itemCount}
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                <p className="text-xs leading-5 text-[#0B3B8F]">
                  Les prix et le montant final seront vérifiés
                  directement par le serveur avant la création de
                  la commande et du paiement.
                </p>
              </div>

              <button
                type="button"
                disabled
                className="mt-5 inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-500"
              >
                Paiement bientôt disponible
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
              >
                Vider le panier
              </button>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
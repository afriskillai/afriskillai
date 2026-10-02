"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteFormationButtonProps = {
  formationId: string;
  formationTitle: string;
};

export default function DeleteFormationButton({
  formationId,
  formationTitle,
}: DeleteFormationButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/formations/${encodeURIComponent(formationId)}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const payload = (await response
        .json()
        .catch(() => null)) as
        | {
            error?: string;
            message?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "La formation n'a pas pu être supprimée.",
        );
      }

      setIsOpen(false);

      router.replace("/admin/formations");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Une erreur est survenue pendant la suppression.",
      );

      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/30"
      >
        <TrashIcon />

        Supprimer
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isDeleting
            ) {
              setIsOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-formation-title"
            aria-describedby="delete-formation-description"
            className="w-full max-w-md overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl"
          >
            <div className="p-6 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <TrashIcon size={22} />
              </div>

              <h2
                id="delete-formation-title"
                className="mt-5 text-xl font-black tracking-tight text-slate-950"
              >
                Supprimer cette formation ?
              </h2>

              <p
                id="delete-formation-description"
                className="mt-3 text-sm leading-6 text-slate-500"
              >
                Vous êtes sur le point de supprimer{" "}
                <strong className="font-bold text-slate-800">
                  {formationTitle}
                </strong>
                . Cette action est définitive.
              </p>

              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-xs font-medium leading-5 text-red-700">
                  La suppression n&apos;est effectuée qu&apos;après
                  votre confirmation.
                </p>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
                >
                  {error}
                </div>
              ) : null}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setError(null);
                    setIsOpen(false);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? (
                    <>
                      <LoadingIcon />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <TrashIcon />
                      Supprimer définitivement
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function TrashIcon({
  size = 17,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
"use client";

import Image from "next/image";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export type FormationImageFile = {
  file: File;
  previewUrl: string;
};

export type FormationImageValue = {
  primary: FormationImageFile | null;
  secondary: FormationImageFile | null;
};

type FormationImagesProps = {
  value: FormationImageValue;

  onChange: (
    value: FormationImageValue,
  ) => void;

  disabled?: boolean;

  existingPrimaryUrl?: string | null;
  existingSecondaryUrl?: string | null;
};

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function FormationImages({
  value,
  onChange,
  disabled = false,
  existingPrimaryUrl = null,
  existingSecondaryUrl = null,
}: FormationImagesProps) {
  const [error, setError] = useState("");

  const primaryInputRef =
    useRef<HTMLInputElement>(null);

  const secondaryInputRef =
    useRef<HTMLInputElement>(null);

  /*
   * Les URL créées par URL.createObjectURL()
   * doivent être révoquées lorsque le composant
   * est démonté.
   */
  const latestValueRef = useRef(value);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      const latest = latestValueRef.current;

      if (latest.primary?.previewUrl) {
        URL.revokeObjectURL(
          latest.primary.previewUrl,
        );
      }

      if (latest.secondary?.previewUrl) {
        URL.revokeObjectURL(
          latest.secondary.previewUrl,
        );
      }
    };
  }, []);

  function selectImage(
    type: "primary" | "secondary",
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    /*
     * Permet de sélectionner à nouveau le même fichier.
     */
    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(
        "Format non accepté. Utilisez une image JPG, PNG ou WebP.",
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "L’image est trop volumineuse. Taille maximale : 5 Mo.",
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    const previous = value[type];

    if (previous?.previewUrl) {
      URL.revokeObjectURL(previous.previewUrl);
    }

    onChange({
      ...value,
      [type]: {
        file,
        previewUrl,
      },
    });
  }

  function removeImage(
    type: "primary" | "secondary",
  ) {
    const current = value[type];

    if (current?.previewUrl) {
      URL.revokeObjectURL(current.previewUrl);
    }

    setError("");

    onChange({
      ...value,
      [type]: null,
    });
  }

  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2">
        <ImageSlot
          title="Image principale"
          description="Image utilisée en priorité dans le catalogue."
          previewUrl={
            value.primary?.previewUrl ??
            existingPrimaryUrl
          }
          required
          disabled={disabled}
          onSelect={() =>
            primaryInputRef.current?.click()
          }
          onRemove={
            value.primary
              ? () => removeImage("primary")
              : undefined
          }
        />

        <ImageSlot
          title="Image secondaire"
          description="Image complémentaire de présentation."
          previewUrl={
            value.secondary?.previewUrl ??
            existingSecondaryUrl
          }
          disabled={disabled}
          onSelect={() =>
            secondaryInputRef.current?.click()
          }
          onRemove={
            value.secondary
              ? () => removeImage("secondary")
              : undefined
          }
        />
      </div>

      <input
        ref={primaryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(event) =>
          selectImage("primary", event)
        }
        className="hidden"
        aria-label="Sélectionner l'image principale"
      />

      <input
        ref={secondaryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(event) =>
          selectImage("secondary", event)
        }
        className="hidden"
        aria-label="Sélectionner l'image secondaire"
      />

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-400">
        <span>JPG, PNG ou WebP</span>
        <span>Maximum 5 Mo par image</span>
        <span>Maximum 2 images</span>
      </div>
    </div>
  );
}

function ImageSlot({
  title,
  description,
  previewUrl,
  required = false,
  disabled,
  onSelect,
  onRemove,
}: {
  title: string;
  description: string;
  previewUrl?: string | null;
  required?: boolean;
  disabled: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-semibold text-slate-700">
          {title}
          {required ? (
            <span className="ml-1 text-blue-600">
              *
            </span>
          ) : null}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 420px"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

            <div className="absolute inset-x-3 bottom-3 flex gap-2">
              <button
                type="button"
                onClick={onSelect}
                disabled={disabled}
                className="flex h-9 flex-1 items-center justify-center rounded-lg bg-white/95 px-3 text-xs font-bold text-slate-800 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remplacer
              </button>

              {onRemove ? (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={disabled}
                  className="flex h-9 items-center justify-center rounded-lg bg-red-600 px-3 text-xs font-bold text-white shadow transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Supprimer
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            className="flex h-full w-full flex-col items-center justify-center p-6 text-center transition hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
              <ImageIcon />
            </span>

            <span className="mt-4 text-sm font-bold text-slate-700">
              Ajouter une image
            </span>

            <span className="mt-1 text-xs text-slate-400">
              Cliquez pour sélectionner
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function ImageIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
      />

      <circle cx="9" cy="9" r="2" />

      <path d="m21 15-5-5L5 20" />
    </svg>
  );
}
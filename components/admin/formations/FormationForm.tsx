"use client";

import Link from "next/link";
import {
  FormEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";

import FormationImages, {
  type FormationImageValue,
} from "@/components/admin/formations/FormationImages";
import FormationDescriptionEditor, {
  type FormationDescriptionImage,
} from "@/components/admin/formations/FormationDescriptionEditor";

export type FormationFormValues = {
  title: string;
  shortDescription: string;
  description: string;
  descriptionContent: JSONContent | null;
  price: string;
  promotionalPrice: string;
  currency: string;
  status: "draft" | "published";
  images: FormationImageValue;
  privateAccessUrl: string;
  privatePdfName: string;
};

type FormationFormProps = {
  mode: "create" | "edit";
  formationId?: string;
  initialValues?: Partial<FormationFormValues>;
};

type ApiImage = {
  id?: string | null;
  url?: string | null;
  altText?: string | null;
  caption?: string | null;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  formation?: {
    id?: string;
  };
  image?: ApiImage;
  descriptionImage?: ApiImage;
  pdf?: {
    name?: string | null;
    size?: number | null;
    hasPdf?: boolean;
    updatedAt?: string;
  };
  fieldErrors?: Record<string, string>;
};

const MAX_PDF_SIZE = 25 * 1024 * 1024;

const defaultValues: FormationFormValues = {
  title: "",
  shortDescription: "",
  description: "",
  descriptionContent: null,
  price: "",
  promotionalPrice: "",
  currency: "XOF",
  status: "draft",
  images: {
    primary: null,
    secondary: null,
  },
  privateAccessUrl: "",
  privatePdfName: "",
};

export default function FormationForm({
  mode,
  formationId,
  initialValues,
}: FormationFormProps) {
  const router = useRouter();

  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const [values, setValues] = useState<FormationFormValues>({
    ...defaultValues,
    ...initialValues,
    images: {
      ...defaultValues.images,
      ...(initialValues?.images ?? {}),
    },
  });

  const [privatePdf, setPrivatePdf] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * En création, cet identifiant reste null jusqu'au premier
   * enregistrement ou jusqu'au premier upload d'une image intégrée.
   *
   * Dès qu'une formation existe réellement en base, on conserve son ID
   * afin de ne jamais créer une deuxième formation pendant le même flux.
   */
  const [workingFormationId, setWorkingFormationId] = useState<string | null>(
    mode === "edit" ? formationId ?? null : null,
  );

  function updateField<
    Key extends keyof Omit<FormationFormValues, "images" | "descriptionContent">,
  >(
    field: Key,
    value: FormationFormValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function handleDescriptionChange({
    content,
    text,
  }: {
    content: JSONContent;
    text: string;
  }) {
    setValues((current) => ({
      ...current,
      description: text,
      descriptionContent: content,
    }));

    if (error) {
      setError("");
    }
  }

  function handlePdfChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0] ?? null;

    setPdfError("");

    if (!file) {
      setPrivatePdf(null);
      return;
    }

    const hasPdfExtension = file.name
      .toLowerCase()
      .endsWith(".pdf");

    const hasAllowedMimeType =
      file.type === "application/pdf" ||
      file.type === "";

    if (!hasPdfExtension || !hasAllowedMimeType) {
      event.target.value = "";
      setPrivatePdf(null);
      setPdfError(
        "Le fichier sélectionné doit être un document PDF.",
      );
      return;
    }

    if (file.size <= 0) {
      event.target.value = "";
      setPrivatePdf(null);
      setPdfError(
        "Le fichier PDF sélectionné est vide.",
      );
      return;
    }

    if (file.size > MAX_PDF_SIZE) {
      event.target.value = "";
      setPrivatePdf(null);
      setPdfError(
        "Le PDF ne doit pas dépasser 25 Mo.",
      );
      return;
    }

    setPrivatePdf(file);

    setValues((current) => ({
      ...current,
      privatePdfName: file.name,
    }));

    if (error) {
      setError("");
    }
  }

  function removeSelectedPdf() {
    setPrivatePdf(null);
    setPdfError("");

    setValues((current) => ({
      ...current,
      privatePdfName:
        mode === "edit"
          ? initialValues?.privatePdfName ?? ""
          : "",
    }));

    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  }

  function validate() {
    const title = values.title.trim();
    const shortDescription =
      values.shortDescription.trim();
    const description =
      values.description.trim();

    const price = Number(values.price);

    const promotionalPrice =
      values.promotionalPrice.trim() === ""
        ? null
        : Number(values.promotionalPrice);

    const privateAccessUrl =
      values.privateAccessUrl.trim();

    if (title.length < 3) {
      return "Le nom de la formation doit contenir au moins 3 caractères.";
    }

    if (title.length > 150) {
      return "Le nom de la formation est trop long.";
    }

    if (shortDescription.length < 10) {
      return "Ajoutez une courte description d’au moins 10 caractères.";
    }

    if (shortDescription.length > 300) {
      return "La courte description ne doit pas dépasser 300 caractères.";
    }

    if (description.length < 30) {
      return "La description complète doit contenir au moins 30 caractères.";
    }

    if (description.length > 50_000) {
      return "La description complète ne doit pas dépasser 50 000 caractères.";
    }

    if (
      !Number.isFinite(price) ||
      !Number.isInteger(price) ||
      price < 0
    ) {
      return "Le prix réel est invalide.";
    }

    if (
      promotionalPrice !== null &&
      (
        !Number.isFinite(promotionalPrice) ||
        !Number.isInteger(promotionalPrice) ||
        promotionalPrice < 0
      )
    ) {
      return "Le prix promotionnel est invalide.";
    }

    if (
      promotionalPrice !== null &&
      promotionalPrice >= price
    ) {
      return "Le prix promotionnel doit être inférieur au prix réel.";
    }

    if (privateAccessUrl) {
      try {
        const url = new URL(privateAccessUrl);

        const isLocalDevelopment =
          url.protocol === "http:" &&
          (
            url.hostname === "localhost" ||
            url.hostname === "127.0.0.1" ||
            url.hostname === "::1"
          );

        if (
          url.protocol !== "https:" &&
          !isLocalDevelopment
        ) {
          return "Le lien privé de la formation doit utiliser HTTPS.";
        }
      } catch {
        return "Le lien privé de la formation est invalide.";
      }
    }

    if (privatePdf) {
      if (
        !privatePdf.name
          .toLowerCase()
          .endsWith(".pdf")
      ) {
        return "Le fichier sélectionné doit être un document PDF.";
      }

      if (privatePdf.size <= 0) {
        return "Le fichier PDF sélectionné est vide.";
      }

      if (privatePdf.size > MAX_PDF_SIZE) {
        return "Le PDF ne doit pas dépasser 25 Mo.";
      }
    }

    return null;
  }

  /*
   * Une image de description doit appartenir à une vraie formation.
   *
   * En modification, l'ID existe déjà.
   *
   * En création, si l'administrateur ajoute une image avant de cliquer
   * sur "Créer la formation", on crée une première version brouillon.
   * Cet ID devient ensuite workingFormationId et le submit final fait
   * une modification de ce brouillon au lieu de créer un doublon.
   */
  async function ensureFormationForDescriptionImage(): Promise<string> {
    const existingId =
      workingFormationId ?? formationId;

    if (existingId) {
      return existingId;
    }

    const title = values.title.trim();
    const shortDescription =
      values.shortDescription.trim();
    const description =
      values.description.trim();

    if (title.length < 3) {
      throw new Error(
        "Renseignez d’abord le nom de la formation avant d’ajouter une image dans la description.",
      );
    }

    if (shortDescription.length < 10) {
      throw new Error(
        "Renseignez d’abord une courte description d’au moins 10 caractères avant d’ajouter une image.",
      );
    }

    if (description.length < 30) {
      throw new Error(
        "Écrivez au moins 30 caractères dans la description avant d’ajouter une image.",
      );
    }

    const currentPrice =
      values.price.trim() !== "" &&
      Number.isFinite(Number(values.price)) &&
      Number.isInteger(Number(values.price)) &&
      Number(values.price) >= 0
        ? Number(values.price)
        : 0;

    const response = await fetch(
      "/api/admin/formations",
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          shortDescription,
          description,
          descriptionContent:
            values.descriptionContent,
          price: currentPrice,
          promotionalPrice: null,
          currency: values.currency,
          status: "draft",
          privateAccessUrl:
            values.privateAccessUrl.trim() ||
            null,
        }),
      },
    );

    const data =
      await readApiResponse(response);

    if (
      !response.ok ||
      !data.success ||
      !data.formation?.id
    ) {
      throw new Error(
        getApiErrorMessage(
          data,
          "Impossible de préparer la formation pour l’ajout de l’image.",
        ),
      );
    }

    setWorkingFormationId(
      data.formation.id,
    );

    return data.formation.id;
  }

  async function handleDescriptionImageUpload(
    file: File,
  ): Promise<FormationDescriptionImage> {
    const targetFormationId =
      await ensureFormationForDescriptionImage();

    const formData = new FormData();

    formData.append(
      "file",
      file,
      file.name,
    );

    formData.append(
      "type",
      "DESCRIPTION",
    );

    const altText = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (altText) {
      formData.append(
        "altText",
        altText,
      );
    }

    const response = await fetch(
      `/api/admin/formations/${encodeURIComponent(
        targetFormationId,
      )}/images`,
      {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      },
    );

    const data =
      await readApiResponse(response);

    const uploadedImage =
      data.image ??
      data.descriptionImage;

    if (
      !response.ok ||
      !data.success ||
      !uploadedImage?.url
    ) {
      throw new Error(
        getApiErrorMessage(
          data,
          "Impossible d’enregistrer l’image de la description.",
        ),
      );
    }

    return {
      id: uploadedImage.id ?? null,
      url: uploadedImage.url,
      altText:
        uploadedImage.altText ??
        altText ??
        null,
      caption:
        uploadedImage.caption ??
        null,
    };
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setPdfError("");

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    /*
     * En création pure, l'image principale reste obligatoire.
     *
     * Si une formation brouillon a déjà été créée automatiquement
     * pour une image de description, l'image principale reste également
     * obligatoire avant l'enregistrement final.
     */
    if (
      mode === "create" &&
      !values.images.primary
    ) {
      setError(
        "Ajoutez l’image principale de la formation avant de continuer.",
      );
      return;
    }

    if (
      mode === "edit" &&
      !(workingFormationId ?? formationId)
    ) {
      setError(
        "Impossible d’identifier la formation à modifier.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // ================================================================
      // 1. CRÉATION / MODIFICATION DE LA FORMATION
      // ================================================================

      const existingFormationId =
        workingFormationId ??
        formationId;

      const endpoint =
        existingFormationId
          ? `/api/admin/formations/${encodeURIComponent(
              existingFormationId,
            )}`
          : "/api/admin/formations";

      const method =
        existingFormationId
          ? "PUT"
          : "POST";

      const response = await fetch(
        endpoint,
        {
          method,
          credentials: "same-origin",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title:
              values.title.trim(),

            shortDescription:
              values.shortDescription.trim(),

            /*
             * Version texte brut.
             *
             * Elle reste utilisée par l'architecture existante :
             * recherche, compatibilité, fallback, métadonnées, etc.
             */
            description:
              values.description.trim(),

            /*
             * Document TipTap complet.
             *
             * L'ordre texte/images est conservé ici.
             */
            descriptionContent:
              values.descriptionContent,

            price:
              Number(values.price),

            promotionalPrice:
              values.promotionalPrice.trim() === ""
                ? null
                : Number(
                    values.promotionalPrice,
                  ),

            currency:
              values.currency,

            status:
              values.status,

            privateAccessUrl:
              values.privateAccessUrl.trim() ||
              null,
          }),
        },
      );

      const data =
        await readApiResponse(response);

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          getApiErrorMessage(
            data,
            "Impossible d’enregistrer la formation.",
          ),
        );
      }

      const savedFormationId =
        data.formation?.id ??
        existingFormationId;

      if (!savedFormationId) {
        throw new Error(
          "La formation a été enregistrée, mais son identifiant n’a pas été retourné par le serveur.",
        );
      }

      setWorkingFormationId(
        savedFormationId,
      );

      // ================================================================
      // 2. UPLOAD DES IMAGES DE PRÉSENTATION
      // ================================================================

      if (values.images.primary) {
        await uploadFormationImage(
          savedFormationId,
          "PRIMARY",
          values.images.primary.file,
        );
      }

      if (values.images.secondary) {
        await uploadFormationImage(
          savedFormationId,
          "SECONDARY",
          values.images.secondary.file,
        );
      }

      // ================================================================
      // 3. UPLOAD DU PDF PRIVÉ
      // ================================================================

      if (privatePdf) {
        const pdfFormData =
          new FormData();

        pdfFormData.append(
          "pdf",
          privatePdf,
          privatePdf.name,
        );

        const pdfEndpoint =
          `/api/admin/formations/${encodeURIComponent(
            savedFormationId,
          )}/pdf`;

        const pdfResponse =
          await fetch(
            pdfEndpoint,
            {
              method: "POST",
              credentials:
                "same-origin",
              body: pdfFormData,
            },
          );

        const pdfData =
          await readApiResponse(
            pdfResponse,
          );

        if (
          !pdfResponse.ok ||
          !pdfData.success
        ) {
          throw new Error(
            getApiErrorMessage(
              pdfData,
              mode === "create"
                ? "La formation a été créée, mais le PDF privé n’a pas pu être enregistré."
                : "Les informations ont été enregistrées, mais le PDF privé n’a pas pu être remplacé.",
            ),
          );
        }

        setValues(
          (current) => ({
            ...current,
            privatePdfName:
              pdfData.pdf?.name ??
              privatePdf.name,
          }),
        );

        setPrivatePdf(null);

        if (
          pdfInputRef.current
        ) {
          pdfInputRef.current.value =
            "";
        }
      }

      // ================================================================
      // 4. REDIRECTION
      // ================================================================

      router.push(
        `/admin/formations/${encodeURIComponent(
          savedFormationId,
        )}`,
      );

      router.refresh();
    } catch (submitError) {
      console.error(
        "[FORMATION_FORM_SUBMIT]",
        submitError,
      );

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue pendant l’enregistrement.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.75fr)]"
      noValidate
    >
      <div className="space-y-6">
        {/* ============================================================= */}
        {/* INFORMATIONS GÉNÉRALES                                        */}
        {/* ============================================================= */}

        <FormSection
          title="Informations générales"
          description="Informations principales affichées dans le catalogue."
        >
          <div>
            <Label htmlFor="formation-title">
              Nom de la formation *
            </Label>

            <input
              id="formation-title"
              type="text"
              maxLength={150}
              value={values.title}
              disabled={isSubmitting}
              onChange={(event) =>
                updateField(
                  "title",
                  event.target.value,
                )
              }
              placeholder="Ex. Maîtriser ChatGPT de A à Z"
              className={
                inputClassName
              }
            />

            <Counter
              current={
                values.title.length
              }
              maximum={150}
            />
          </div>

          <div>
            <Label htmlFor="formation-short-description">
              Courte description *
            </Label>

            <textarea
              id="formation-short-description"
              rows={3}
              maxLength={300}
              value={
                values.shortDescription
              }
              disabled={isSubmitting}
              onChange={(event) =>
                updateField(
                  "shortDescription",
                  event.target.value,
                )
              }
              placeholder="Présentez en quelques lignes l’objectif principal de la formation."
              className={`${inputClassName} min-h-[110px] resize-y py-3`}
            />

            <Counter
              current={
                values
                  .shortDescription
                  .length
              }
              maximum={300}
            />
          </div>

          <div>
            <div className="mb-2">
              <p className="text-sm font-semibold text-slate-700">
                Description complète *
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Structurez votre contenu
                avec des titres, du texte,
                des listes et des images
                placées exactement à
                l&apos;endroit souhaité.
              </p>
            </div>

            <FormationDescriptionEditor
              value={
                values.descriptionContent
              }
              fallbackText={
                values.description
              }
              disabled={
                isSubmitting
              }
              placeholder="Expliquez ce que l’apprenant va apprendre, à qui s’adresse la formation et les compétences développées. Vous pouvez insérer des images exactement entre les paragraphes."
              onChange={
                handleDescriptionChange
              }
              onUploadImage={
                handleDescriptionImageUpload
              }
            />

            <Counter
              current={
                values.description.length
              }
              maximum={50_000}
            />
          </div>
        </FormSection>

        {/* ============================================================= */}
        {/* IMAGES DE PRÉSENTATION                                        */}
        {/* ============================================================= */}

        <FormSection
          title="Images de présentation"
          description="Ajoutez au maximum deux images : une principale et une secondaire."
        >
          <FormationImages
            value={values.images}
            onChange={(images) => {
              setValues(
                (current) => ({
                  ...current,
                  images,
                }),
              );

              if (error) {
                setError("");
              }
            }}
            disabled={isSubmitting}
          />
        </FormSection>

        {/* ============================================================= */}
        {/* CONTENU PRIVÉ                                                  */}
        {/* ============================================================= */}

        <FormSection
          title="Contenu privé de la formation"
          description="Ajoutez le PDF et/ou le lien privé qui seront délivrés uniquement après validation du paiement."
        >
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                <LockIcon />
              </div>

              <div>
                <p className="text-sm font-bold text-amber-950">
                  Informations
                  confidentielles
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800/80">
                  Le PDF et le lien
                  privé ne doivent
                  jamais être affichés
                  dans le catalogue
                  public. Ils seront
                  délivrés au client
                  uniquement après
                  confirmation réelle
                  du paiement côté
                  serveur.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="formation-private-pdf">
              PDF de la formation
            </Label>

            <input
              ref={pdfInputRef}
              id="formation-private-pdf"
              type="file"
              accept="application/pdf,.pdf"
              disabled={isSubmitting}
              onChange={
                handlePdfChange
              }
              className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-4 file:py-3.5 file:text-sm file:font-bold file:text-blue-700 hover:file:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
            />

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Format accepté : PDF.
              Taille maximale : 25
              Mo. Le document sera
              stocké dans un espace
              privé.
            </p>

            {pdfError ? (
              <p
                role="alert"
                className="mt-2 text-xs font-semibold text-red-600"
              >
                {pdfError}
              </p>
            ) : null}

            {privatePdf ? (
              <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-emerald-900">
                    {privatePdf.name}
                  </p>

                  <p className="mt-0.5 text-xs text-emerald-700">
                    {formatFileSize(
                      privatePdf.size,
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    removeSelectedPdf
                  }
                  disabled={
                    isSubmitting
                  }
                  className="shrink-0 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Retirer
                </button>
              </div>
            ) : values.privatePdfName ? (
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-800">
                  PDF actuellement
                  enregistré
                </p>

                <p className="mt-1 truncate text-sm font-bold text-blue-950">
                  {
                    values.privatePdfName
                  }
                </p>
              </div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="formation-private-link">
              Lien privé de la
              formation
            </Label>

            <input
              id="formation-private-link"
              type="url"
              maxLength={2048}
              autoComplete="off"
              spellCheck={false}
              value={
                values.privateAccessUrl
              }
              disabled={isSubmitting}
              onChange={(event) =>
                updateField(
                  "privateAccessUrl",
                  event.target.value,
                )
              }
              placeholder="https://..."
              className={
                inputClassName
              }
            />

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Ce lien est réservé aux
              clients dont le paiement
              a été confirmé. Il ne
              doit jamais apparaître
              sur les pages publiques
              de la formation.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-sm font-bold text-blue-950">
              Livraison après paiement
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700/80">
              Après validation réelle
              du paiement, AfriSkill
              AI pourra envoyer
              automatiquement au
              client un e-mail
              contenant son accès au
              PDF et le lien privé de
              cette formation.
            </p>
          </div>
        </FormSection>

        {/* ============================================================= */}
        {/* TARIFICATION                                                   */}
        {/* ============================================================= */}

        <FormSection
          title="Tarification"
          description="Définissez le prix normal et, si nécessaire, un prix promotionnel."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="formation-price">
                Prix réel *
              </Label>

              <input
                id="formation-price"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={values.price}
                disabled={
                  isSubmitting
                }
                onChange={(event) =>
                  updateField(
                    "price",
                    event.target.value,
                  )
                }
                placeholder="25000"
                className={
                  inputClassName
                }
              />
            </div>

            <div>
              <Label htmlFor="formation-promo-price">
                Prix promotionnel
              </Label>

              <input
                id="formation-promo-price"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={
                  values.promotionalPrice
                }
                disabled={
                  isSubmitting
                }
                onChange={(event) =>
                  updateField(
                    "promotionalPrice",
                    event.target.value,
                  )
                }
                placeholder="15000"
                className={
                  inputClassName
                }
              />
            </div>
          </div>

          <div className="max-w-xs">
            <Label htmlFor="formation-currency">
              Devise
            </Label>

            <select
              id="formation-currency"
              value={values.currency}
              disabled={isSubmitting}
              onChange={(event) =>
                updateField(
                  "currency",
                  event.target.value,
                )
              }
              className={
                inputClassName
              }
            >
              <option value="XOF">
                FCFA (XOF)
              </option>

              <option value="EUR">
                Euro (EUR)
              </option>

              <option value="USD">
                Dollar américain
                (USD)
              </option>
            </select>
          </div>
        </FormSection>
      </div>

      {/* =============================================================== */}
      {/* COLONNE DROITE                                                  */}
      {/* =============================================================== */}

      <div className="space-y-6 xl:sticky xl:top-[106px] xl:self-start">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-950">
            Publication
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Contrôlez la visibilité de
            cette formation.
          </p>

          <div className="mt-5 space-y-3">
            <StatusChoice
              checked={
                values.status ===
                "draft"
              }
              title="Brouillon"
              description="La formation reste invisible au public."
              onClick={() =>
                updateField(
                  "status",
                  "draft",
                )
              }
              disabled={
                isSubmitting
              }
            />

            <StatusChoice
              checked={
                values.status ===
                "published"
              }
              title="Publier"
              description="La formation pourra être visible dans le catalogue."
              onClick={() =>
                updateField(
                  "status",
                  "published",
                )
              }
              disabled={
                isSubmitting
              }
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-700"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#075ee8] px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#064fca] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  Enregistrement...
                </>
              ) : mode === "create" ? (
                workingFormationId
                  ? "Finaliser la formation"
                  : "Créer la formation"
              ) : (
                "Enregistrer les modifications"
              )}
            </button>

            <Link
              href={
                mode === "edit" &&
                formationId
                  ? `/admin/formations/${encodeURIComponent(
                      formationId,
                    )}`
                  : "/admin/formations"
              }
              className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </Link>
          </div>
        </section>

        <section className="rounded-[24px] border border-blue-100 bg-blue-50/70 p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <InfoIcon />
            </div>

            <div>
              <p className="text-sm font-bold text-blue-950">
                Livraison de la
                formation
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700/70">
                Le PDF et le lien sont
                des contenus privés.
                Ils ne doivent être
                transmis qu&apos;après
                confirmation du
                paiement par le
                serveur.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-950">
            Description enrichie
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Le texte brut reste
            enregistré pour assurer
            la compatibilité avec
            l&apos;architecture
            existante. Le document
            enrichi conserve les
            titres, listes et images
            dans leur ordre exact.
          </p>
        </section>
      </div>
    </form>
  );
}

const inputClassName =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-slate-100 pb-5">
        <h2 className="font-bold text-slate-950">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {children}
      </div>
    </section>
  );
}

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      {children}
    </label>
  );
}

function Counter({
  current,
  maximum,
}: {
  current: number;
  maximum: number;
}) {
  return (
    <p className="mt-1.5 text-right text-[11px] text-slate-400">
      {current}/{maximum}
    </p>
  );
}

function StatusChoice({
  checked,
  title,
  description,
  onClick,
  disabled,
}: {
  checked: boolean;
  title: string;
  description: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
        checked
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 hover:bg-slate-50",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          checked
            ? "border-blue-600 bg-blue-600"
            : "border-slate-300 bg-white",
        ].join(" ")}
      >
        {checked ? (
          <span className="h-2 w-2 rounded-full bg-white" />
        ) : null}
      </span>

      <span>
        <span className="block text-sm font-bold text-slate-800">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-400">
          {description}
        </span>
      </span>
    </button>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}

function InfoIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
      />

      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </svg>
  );
}

function formatFileSize(
  bytes: number,
) {
  if (bytes < 1024) {
    return `${bytes} octets`;
  }

  const kilobytes =
    bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(
      1,
    )} Ko`;
  }

  const megabytes =
    kilobytes / 1024;

  return `${megabytes.toFixed(
    1,
  )} Mo`;
}

async function uploadFormationImage(
  formationId: string,
  type: "PRIMARY" | "SECONDARY",
  file: File,
) {
  const formData =
    new FormData();

  formData.append(
    "file",
    file,
    file.name,
  );

  formData.append(
    "type",
    type,
  );

  const response = await fetch(
    `/api/admin/formations/${encodeURIComponent(
      formationId,
    )}/images`,
    {
      method: "POST",
      credentials:
        "same-origin",
      body: formData,
    },
  );

  const data =
    await readApiResponse(response);

  if (
    !response.ok ||
    !data.success
  ) {
    const label =
      type === "PRIMARY"
        ? "l’image principale"
        : "l’image secondaire";

    throw new Error(
      getApiErrorMessage(
        data,
        `Impossible d’enregistrer ${label} de la formation.`,
      ),
    );
  }
}

async function readApiResponse(
  response: Response,
): Promise<ApiResponse> {
  try {
    const contentType =
      response.headers
        .get("content-type")
        ?.toLowerCase() ?? "";

    if (
      !contentType.includes(
        "application/json",
      )
    ) {
      return {};
    }

    return (
      (await response.json()) as
        ApiResponse
    );
  } catch {
    return {};
  }
}

function getApiErrorMessage(
  data: ApiResponse,
  fallback: string,
) {
  if (
    typeof data.message ===
      "string" &&
    data.message.trim()
  ) {
    return data.message.trim();
  }

  if (data.fieldErrors) {
    const firstFieldError =
      Object.values(
        data.fieldErrors,
      ).find(
        (message) =>
          typeof message ===
            "string" &&
          message.trim(),
      );

    if (firstFieldError) {
      return firstFieldError;
    }
  }

  return fallback;
}
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  EditorContent,
  useEditor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EMPTY_DOCUMENT: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export type FormationDescriptionImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  caption?: string | null;
};

export type FormationDescriptionEditorValue = {
  content: JSONContent;
  text: string;
};

type FormationDescriptionEditorProps = {
  value?: JSONContent | null;
  fallbackText?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (value: FormationDescriptionEditorValue) => void;
  onUploadImage?: (
    file: File,
  ) => Promise<FormationDescriptionImage>;
};

const AfriSkillImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      imageId: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-image-id"),
        renderHTML: (attributes) => {
          if (!attributes.imageId) {
            return {};
          }

          return {
            "data-image-id": attributes.imageId,
          };
        },
      },
    };
  },
}).configure({
  inline: false,
  allowBase64: false,
});

export default function FormationDescriptionEditor({
  value,
  fallbackText = "",
  disabled = false,
  placeholder = "Présentez la formation en détail : objectifs, contenu, avantages, résultats attendus…",
  onChange,
  onUploadImage,
}: FormationDescriptionEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploadingImage, setIsUploadingImage] =
    useState(false);

  const [imageError, setImageError] =
    useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  const onUploadImageRef = useRef(onUploadImage);
  const disabledRef = useRef(disabled);
  const isUploadingRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onUploadImageRef.current = onUploadImage;
  }, [onUploadImage]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const initialContent = useMemo(
    () => buildInitialContent(value, fallbackText),
    // L'éditeur ne doit être initialisé qu'une seule fois.
    // Les changements externes sont synchronisés plus bas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      AfriSkillImage,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: [
          "afriskill-description-editor",
          "min-h-[320px]",
          "w-full",
          "px-4",
          "py-4",
          "text-[15px]",
          "leading-7",
          "text-slate-800",
          "outline-none",
          "sm:min-h-[380px]",
          "sm:px-5",
          "sm:py-5",
          "sm:text-base",
        ].join(" "),
      },
      handlePaste: (_view, event) => {
        if (disabledRef.current) {
          return false;
        }

        const files = getImageFilesFromClipboard(event);

        if (files.length === 0) {
          return false;
        }

        event.preventDefault();
        void uploadFiles(files);

        return true;
      },
      handleDrop: (_view, event) => {
        if (disabledRef.current) {
          return false;
        }

        const files = getImageFilesFromDataTransfer(
          event.dataTransfer,
        );

        if (files.length === 0) {
          return false;
        }

        event.preventDefault();
        void uploadFiles(files);

        return true;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      emitChange(
        currentEditor.getJSON(),
        currentEditor.getText({
          blockSeparator: "\n\n",
        }),
      );
    },
  });

  const emitChange = useCallback(
    (content: JSONContent, text: string) => {
      onChangeRef.current?.({
        content,
        text: normalizePlainText(text),
      });
    },
    [],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor || value === undefined) {
      return;
    }

    const nextContent =
      value ?? buildDocumentFromText(fallbackText);

    const currentJson = JSON.stringify(editor.getJSON());
    const nextJson = JSON.stringify(nextContent);

    if (currentJson === nextJson) {
      return;
    }

    editor.commands.setContent(nextContent, {
      emitUpdate: false,
    });
  }, [editor, value, fallbackText]);

  async function uploadFiles(files: File[]) {
    if (
      disabledRef.current ||
      isUploadingRef.current
    ) {
      return;
    }

    setImageError(null);

    const uploadImage = onUploadImageRef.current;

    if (!uploadImage) {
      setImageError(
        "L'envoi des images n'est pas encore configuré pour cette formation.",
      );
      return;
    }

    const validFiles: File[] = [];

    for (const file of files) {
      const validationError = validateImageFile(file);

      if (validationError) {
        setImageError(validationError);
        return;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    isUploadingRef.current = true;
    setIsUploadingImage(true);

    try {
      for (const file of validFiles) {
        /*
         * L'upload peut échouer pour une validation métier normale :
         * titre manquant, description trop courte, API indisponible, etc.
         *
         * Ces erreurs sont affichées proprement sous l'éditeur.
         * Elles ne doivent jamais remonter comme erreur non gérée
         * jusqu'à l'overlay Next.js.
         */
        const uploadedImage = await uploadImage(file);

        if (
          !uploadedImage ||
          !isSafeImageUrl(uploadedImage.url)
        ) {
          setImageError(
            "L'image a été envoyée, mais l'API n'a pas retourné une URL HTTPS valide.",
          );
          return;
        }

        if (!editor) {
          setImageError(
            "L'éditeur n'est pas encore disponible. Réessayez dans quelques secondes.",
          );
          return;
        }

        const altText =
          normalizeOptionalText(uploadedImage.altText) ||
          buildDefaultAltText(file.name);

        const inserted = editor
          .chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: {
              src: uploadedImage.url,
              alt: altText,
              title:
                normalizeOptionalText(
                  uploadedImage.caption,
                ) || null,
              imageId: uploadedImage.id ?? null,
            },
          })
          .createParagraphNear()
          .focus()
          .run();

        if (!inserted) {
          setImageError(
            "L'image a été envoyée, mais elle n'a pas pu être insérée dans la description.",
          );
          return;
        }

        setImageError(null);
      }
    } catch (uploadError: unknown) {
      /*
       * IMPORTANT :
       *
       * Ne pas utiliser console.error ici.
       * Next.js intercepte console.error en développement
       * et peut afficher son overlay d'erreur alors que cette erreur
       * est volontairement gérée par l'interface.
       */
      setImageError(
        getErrorMessage(
          uploadError,
          "Impossible d'ajouter l'image à la description.",
        ),
      );
    } finally {
      isUploadingRef.current = false;
      setIsUploadingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function openImagePicker() {
    if (
      disabled ||
      isUploadingImage
    ) {
      return;
    }

    setImageError(null);
    fileInputRef.current?.click();
  }

  async function handleImageInputChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(
      event.target.files ?? [],
    );

    if (files.length === 0) {
      return;
    }

    await uploadFiles(files);
  }

  function removeSelectedImage() {
    if (!editor || disabled) {
      return;
    }

    if (!editor.isActive("image")) {
      return;
    }

    editor
      .chain()
      .focus()
      .deleteSelection()
      .run();

    setImageError(null);
  }

  if (!editor) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex min-h-[320px] items-center justify-center px-6 text-center text-sm font-medium text-slate-500 sm:min-h-[380px]">
          Chargement de l&apos;éditeur…
        </div>
      </div>
    );
  }

  const hasSelectedImage =
    editor.isActive("image");

  return (
    <div className="w-full">
      <div
        className={[
          "overflow-hidden",
          "rounded-2xl",
          "border",
          imageError
            ? "border-red-300"
            : "border-slate-200",
          "bg-white",
          "shadow-sm",
          "transition",
          "focus-within:border-slate-400",
          "focus-within:ring-4",
          "focus-within:ring-slate-100",
        ].join(" ")}
      >
        <div
          className={[
            "sticky",
            "top-0",
            "z-10",
            "border-b",
            "border-slate-200",
            "bg-slate-50/95",
            "px-2",
            "py-2",
            "backdrop-blur",
            "sm:px-3",
          ].join(" ")}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <ToolbarButton
              label="Paragraphe"
              title="Paragraphe"
              active={editor.isActive("paragraph")}
              disabled={disabled}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setParagraph()
                  .run()
              }
            >
              P
            </ToolbarButton>

            <ToolbarButton
              label="Titre 2"
              title="Titre principal de section"
              active={editor.isActive("heading", {
                level: 2,
              })}
              disabled={disabled}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({
                    level: 2,
                  })
                  .run()
              }
            >
              H2
            </ToolbarButton>

            <ToolbarButton
              label="Titre 3"
              title="Sous-titre"
              active={editor.isActive("heading", {
                level: 3,
              })}
              disabled={disabled}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({
                    level: 3,
                  })
                  .run()
              }
            >
              H3
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              label="Gras"
              title="Gras"
              active={editor.isActive("bold")}
              disabled={disabled}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleBold()
                  .run()
              }
            >
              <strong>B</strong>
            </ToolbarButton>

            <ToolbarButton
              label="Italique"
              title="Italique"
              active={editor.isActive("italic")}
              disabled={disabled}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleItalic()
                  .run()
              }
            >
              <em>I</em>
            </ToolbarButton>

            <ToolbarButton
              label="Barré"
              title="Texte barré"
              active={editor.isActive("strike")}
              disabled={disabled}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleStrike()
                  .run()
              }
            >
              <span className="line-through">
                S
              </span>
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              label="Liste à puces"
              title="Liste à puces"
              active={editor.isActive("bulletList")}
              disabled={disabled}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleBulletList()
                  .run()
              }
            >
              • Liste
            </ToolbarButton>

            <ToolbarButton
              label="Liste numérotée"
              title="Liste numérotée"
              active={editor.isActive("orderedList")}
              disabled={disabled}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleOrderedList()
                  .run()
              }
            >
              1. Liste
            </ToolbarButton>

            <ToolbarButton
              label="Citation"
              title="Citation"
              active={editor.isActive("blockquote")}
              disabled={disabled}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleBlockquote()
                  .run()
              }
            >
              “ ”
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              label="Ajouter une image"
              title="Ajouter une image depuis l'ordinateur"
              active={false}
              disabled={
                disabled ||
                isUploadingImage
              }
              onClick={openImagePicker}
              emphasized
            >
              {isUploadingImage
                ? "Ajout…"
                : "＋ Image"}
            </ToolbarButton>

            {hasSelectedImage ? (
              <ToolbarButton
                label="Supprimer l'image"
                title="Supprimer l'image sélectionnée"
                active={false}
                disabled={disabled}
                onClick={removeSelectedImage}
                danger
              >
                Supprimer
              </ToolbarButton>
            ) : null}

            <ToolbarDivider />

            <ToolbarButton
              label="Annuler"
              title="Annuler"
              active={false}
              disabled={
                disabled ||
                !editor
                  .can()
                  .chain()
                  .focus()
                  .undo()
                  .run()
              }
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .undo()
                  .run()
              }
            >
              ↶
            </ToolbarButton>

            <ToolbarButton
              label="Rétablir"
              title="Rétablir"
              active={false}
              disabled={
                disabled ||
                !editor
                  .can()
                  .chain()
                  .focus()
                  .redo()
                  .run()
              }
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .redo()
                  .run()
              }
            >
              ↷
            </ToolbarButton>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          disabled={
            disabled ||
            isUploadingImage
          }
          onChange={handleImageInputChange}
        />

        <div className="relative">
          {editor.isEmpty ? (
            <div
              className={[
                "pointer-events-none",
                "absolute",
                "left-4",
                "right-4",
                "top-4",
                "z-[1]",
                "text-[15px]",
                "leading-7",
                "text-slate-400",
                "sm:left-5",
                "sm:right-5",
                "sm:top-5",
                "sm:text-base",
              ].join(" ")}
            >
              {placeholder}
            </div>
          ) : null}

          <EditorContent editor={editor} />
        </div>

        <div
          className={[
            "flex",
            "flex-col",
            "gap-2",
            "border-t",
            "border-slate-100",
            "bg-slate-50",
            "px-4",
            "py-3",
            "sm:flex-row",
            "sm:items-center",
            "sm:justify-between",
          ].join(" ")}
        >
          <p className="text-xs leading-5 text-slate-500">
        
          </p>

          <p className="shrink-0 text-xs font-semibold text-slate-500">
            {formatCharacterCount(
              editor.getText().length,
            )}
          </p>
        </div>
      </div>

      {imageError ? (
        <div
          role="alert"
          className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium leading-5 text-red-700"
        >
          {imageError}
        </div>
      ) : null}

      <style jsx global>{`
        .afriskill-description-editor {
          word-break: break-word;
        }

        .afriskill-description-editor > *:first-child {
          margin-top: 0;
        }

        .afriskill-description-editor > *:last-child {
          margin-bottom: 0;
        }

        .afriskill-description-editor p {
          margin: 0 0 1rem;
        }

        .afriskill-description-editor h1,
        .afriskill-description-editor h2,
        .afriskill-description-editor h3,
        .afriskill-description-editor h4 {
          color: #0f172a;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .afriskill-description-editor h1 {
          margin: 1.75rem 0 0.85rem;
          font-size: 1.75rem;
          line-height: 1.2;
        }

        .afriskill-description-editor h2 {
          margin: 1.6rem 0 0.8rem;
          font-size: 1.45rem;
          line-height: 1.25;
        }

        .afriskill-description-editor h3 {
          margin: 1.4rem 0 0.7rem;
          font-size: 1.2rem;
          line-height: 1.3;
        }

        .afriskill-description-editor h4 {
          margin: 1.25rem 0 0.65rem;
          font-size: 1.05rem;
          line-height: 1.35;
        }

        .afriskill-description-editor ul,
        .afriskill-description-editor ol {
          margin: 0.75rem 0 1rem;
          padding-left: 1.6rem;
        }

        .afriskill-description-editor ul {
          list-style: disc;
        }

        .afriskill-description-editor ol {
          list-style: decimal;
        }

        .afriskill-description-editor li {
          margin: 0.3rem 0;
        }

        .afriskill-description-editor li p {
          margin: 0;
        }

        .afriskill-description-editor blockquote {
          margin: 1.25rem 0;
          border-left: 4px solid #cbd5e1;
          border-radius: 0 0.75rem 0.75rem 0;
          background: #f8fafc;
          padding: 0.85rem 1rem;
          color: #475569;
        }

        .afriskill-description-editor hr {
          margin: 1.75rem 0;
          border: 0;
          border-top: 1px solid #e2e8f0;
        }

        .afriskill-description-editor strong {
          font-weight: 800;
        }

        .afriskill-description-editor code {
          border-radius: 0.35rem;
          background: #f1f5f9;
          padding: 0.12rem 0.35rem;
          font-size: 0.9em;
          color: #0f172a;
        }

        .afriskill-description-editor img {
          display: block;
          width: auto;
          max-width: 100%;
          max-height: 680px;
          margin: 1.5rem auto;
          border-radius: 1rem;
          object-fit: contain;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.05),
            0 8px 24px rgba(15, 23, 42, 0.08);
        }

        .afriskill-description-editor img.ProseMirror-selectednode {
          outline: 3px solid rgba(37, 99, 235, 0.35);
          outline-offset: 4px;
        }

        .afriskill-description-editor.ProseMirror-focused {
          outline: none;
        }

        .afriskill-description-editor
          .ProseMirror-gapcursor::after {
          border-top-color: #2563eb;
        }

        @media (max-width: 640px) {
          .afriskill-description-editor h1 {
            font-size: 1.45rem;
          }

          .afriskill-description-editor h2 {
            font-size: 1.3rem;
          }

          .afriskill-description-editor h3 {
            font-size: 1.15rem;
          }

          .afriskill-description-editor img {
            margin: 1.25rem auto;
            border-radius: 0.85rem;
          }
        }
      `}</style>
    </div>
  );

  /*
   * Déclaration interne volontaire :
   * les handlers TipTap créés lors de useEditor peuvent appeler
   * cette fonction sans dépendre d'un état React périmé.
   */
  async function uploadFilesFromEditor(
    files: File[],
  ) {
    await uploadFiles(files);
  }
}

type ToolbarButtonProps = {
  children: ReactNode;
  label: string;
  title: string;
  active: boolean;
  disabled: boolean;
  emphasized?: boolean;
  danger?: boolean;
  onClick: () => void;
};

function ToolbarButton({
  children,
  label,
  title,
  active,
  disabled,
  emphasized = false,
  danger = false,
  onClick,
}: ToolbarButtonProps) {
  let appearance = [
    "border-slate-200",
    "bg-white",
    "text-slate-700",
    "hover:border-slate-300",
    "hover:bg-slate-100",
  ].join(" ");

  if (active) {
    appearance = [
      "border-slate-900",
      "bg-slate-900",
      "text-white",
      "hover:bg-slate-800",
    ].join(" ");
  }

  if (emphasized && !active) {
    appearance = [
      "border-slate-900",
      "bg-slate-900",
      "text-white",
      "hover:bg-slate-800",
    ].join(" ");
  }

  if (danger) {
    appearance = [
      "border-red-200",
      "bg-red-50",
      "text-red-700",
      "hover:border-red-300",
      "hover:bg-red-100",
    ].join(" ");
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onClick}
      className={[
        "inline-flex",
        "min-h-9",
        "items-center",
        "justify-center",
        "rounded-lg",
        "border",
        "px-2.5",
        "text-xs",
        "font-bold",
        "transition",
        "select-none",
        appearance,
        "disabled:cursor-not-allowed",
        "disabled:opacity-40",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <span
      aria-hidden="true"
      className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block"
    />
  );
}

function buildInitialContent(
  value: JSONContent | null | undefined,
  fallbackText: string,
): JSONContent {
  if (isUsableDocument(value)) {
    return value;
  }

  if (fallbackText.trim()) {
    return buildDocumentFromText(fallbackText);
  }

  return EMPTY_DOCUMENT;
}

function buildDocumentFromText(
  value: string,
): JSONContent {
  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!normalized) {
    return EMPTY_DOCUMENT;
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph): JSONContent => ({
        type: "paragraph",
        content: paragraph
          .split("\n")
          .flatMap(
            (
              line,
              index,
              array,
            ): JSONContent[] => {
              const nodes: JSONContent[] = [];

              if (line) {
                nodes.push({
                  type: "text",
                  text: line,
                });
              }

              if (index < array.length - 1) {
                nodes.push({
                  type: "hardBreak",
                });
              }

              return nodes;
            },
          ),
      }),
    );

  return {
    type: "doc",
    content:
      paragraphs.length > 0
        ? paragraphs
        : [{ type: "paragraph" }],
  };
}

function isUsableDocument(
  value: JSONContent | null | undefined,
): value is JSONContent {
  return Boolean(
    value &&
      value.type === "doc" &&
      Array.isArray(value.content),
  );
}

function getImageFilesFromClipboard(
  event: ClipboardEvent,
): File[] {
  const items = Array.from(
    event.clipboardData?.items ?? [],
  );

  const files: File[] = [];

  for (const item of items) {
    if (
      item.kind !== "file" ||
      !item.type.startsWith("image/")
    ) {
      continue;
    }

    const file = item.getAsFile();

    if (file) {
      files.push(file);
    }
  }

  return files;
}

function getImageFilesFromDataTransfer(
  dataTransfer: DataTransfer | null,
): File[] {
  if (!dataTransfer) {
    return [];
  }

  return Array.from(
    dataTransfer.files,
  ).filter((file) =>
    file.type.startsWith("image/"),
  );
}

function validateImageFile(
  file: File,
): string | null {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return "Format d'image non pris en charge. Utilisez JPG, PNG ou WEBP.";
  }

  if (file.size <= 0) {
    return "Le fichier image est vide.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "L'image est trop volumineuse. Taille maximale : 5 Mo.";
  }

  return null;
}

function buildDefaultAltText(
  fileName: string,
) {
  const withoutExtension =
    fileName.replace(/\.[^.]+$/, "");

  const normalized = withoutExtension
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    normalized ||
    "Illustration de la formation"
  );
}

function isSafeImageUrl(
  value: string,
) {
  try {
    const url = new URL(value);

    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizePlainText(
  value: string,
) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeOptionalText(
  value: string | null | undefined,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function formatCharacterCount(
  count: number,
) {
  return `${count.toLocaleString(
    "fr-FR",
  )} caractère${
    count > 1 ? "s" : ""
  }`;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return fallback;
}
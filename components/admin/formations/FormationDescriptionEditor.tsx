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

import { Node as TiptapNode } from "@tiptap/core";
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

type VideoProvider = "youtube" | "vimeo";

type ParsedVideo = {
  provider: VideoProvider;
  videoId: string;
  videoUrl: string;
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

/**
 * Vidéo publique de démonstration.
 *
 * Le nœud ne stocke jamais :
 * - d'iframe arbitraire ;
 * - de HTML ;
 * - de script.
 *
 * Il conserve uniquement :
 * - le fournisseur ;
 * - l'identifiant normalisé ;
 * - l'URL originale normalisée ;
 * - le titre optionnel.
 */
const AfriSkillVideo = TiptapNode.create({
  name: "video",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  isolating: true,

  addAttributes() {
    return {
      provider: {
        default: null,

        parseHTML: (element) =>
          element.getAttribute("data-video-provider"),

        renderHTML: (attributes) => {
          if (!attributes.provider) {
            return {};
          }

          return {
            "data-video-provider": attributes.provider,
          };
        },
      },

      videoId: {
        default: null,

        parseHTML: (element) =>
          element.getAttribute("data-video-id"),

        renderHTML: (attributes) => {
          if (!attributes.videoId) {
            return {};
          }

          return {
            "data-video-id": attributes.videoId,
          };
        },
      },

      videoUrl: {
        default: null,

        parseHTML: (element) =>
          element.getAttribute("data-video-url"),

        renderHTML: (attributes) => {
          if (!attributes.videoUrl) {
            return {};
          }

          return {
            "data-video-url": attributes.videoUrl,
          };
        },
      },

      videoTitle: {
        default: null,

        parseHTML: (element) =>
          element.getAttribute("data-video-title"),

        renderHTML: (attributes) => {
          if (!attributes.videoTitle) {
            return {};
          }

          return {
            "data-video-title": attributes.videoTitle,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-afriskill-video="true"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const provider =
      HTMLAttributes["data-video-provider"] === "vimeo"
        ? "Vimeo"
        : "YouTube";

    const title =
      typeof HTMLAttributes["data-video-title"] === "string" &&
      HTMLAttributes["data-video-title"].trim()
        ? HTMLAttributes["data-video-title"].trim()
        : "Vidéo de démonstration";

    return [
      "div",
      {
        ...HTMLAttributes,
        "data-afriskill-video": "true",
        class: "afriskill-description-video",
      },
      [
        "div",
        {
          class: "afriskill-description-video__preview",
        },
        [
          "div",
          {
            class: "afriskill-description-video__play",
            "aria-hidden": "true",
          },
          "▶",
        ],
        [
          "div",
          {
            class: "afriskill-description-video__content",
          },
          [
            "strong",
            {
              class: "afriskill-description-video__title",
            },
            title,
          ],
          [
            "span",
            {
              class: "afriskill-description-video__provider",
            },
            `Vidéo ${provider}`,
          ],
        ],
      ],
    ];
  },
});

export default function FormationDescriptionEditor({
  value,
  fallbackText = "",
  disabled = false,
  placeholder =
    "Présentez la formation en détail : objectifs, contenu, avantages, résultats attendus…",
  onChange,
  onUploadImage,
}: FormationDescriptionEditorProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [isUploadingImage, setIsUploadingImage] =
    useState(false);

  const [imageError, setImageError] =
    useState<string | null>(null);

  const [videoError, setVideoError] =
    useState<string | null>(null);

  const [isVideoDialogOpen, setIsVideoDialogOpen] =
    useState(false);

  const [videoUrl, setVideoUrl] =
    useState("");

  const [videoTitle, setVideoTitle] =
    useState("");

  const [editingVideo, setEditingVideo] =
    useState(false);

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

  const emitChange = useCallback(
    (content: JSONContent, text: string) => {
      onChangeRef.current?.({
        content,
        text: normalizePlainText(text),
      });
    },
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
      AfriSkillVideo,
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

        const files =
          getImageFilesFromClipboard(event);

        if (files.length === 0) {
          return false;
        }

        event.preventDefault();

        void uploadFilesFromEditor(files);

        return true;
      },

      handleDrop: (_view, event) => {
        if (disabledRef.current) {
          return false;
        }

        const files =
          getImageFilesFromDataTransfer(
            event.dataTransfer,
          );

        if (files.length === 0) {
          return false;
        }

        event.preventDefault();

        void uploadFilesFromEditor(files);

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

    const currentJson =
      JSON.stringify(editor.getJSON());

    const nextJson =
      JSON.stringify(nextContent);

    if (currentJson === nextJson) {
      return;
    }

    editor.commands.setContent(nextContent, {
      emitUpdate: false,
    });
  }, [editor, value, fallbackText]);

  useEffect(() => {
    if (!isVideoDialogOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeVideoDialog();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isVideoDialogOpen]);

  async function uploadFiles(files: File[]) {
    if (
      disabledRef.current ||
      isUploadingRef.current
    ) {
      return;
    }

    setImageError(null);

    const uploadImage =
      onUploadImageRef.current;

    if (!uploadImage) {
      setImageError(
        "L'envoi des images n'est pas encore configuré pour cette formation.",
      );

      return;
    }

    const validFiles: File[] = [];

    for (const file of files) {
      const validationError =
        validateImageFile(file);

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
        const uploadedImage =
          await uploadImage(file);

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
          normalizeOptionalText(
            uploadedImage.altText,
          ) ||
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

              imageId:
                uploadedImage.id ?? null,
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

  async function uploadFilesFromEditor(
    files: File[],
  ) {
    await uploadFiles(files);
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

  function openVideoDialog() {
    if (!editor || disabled) {
      return;
    }

    setVideoError(null);

    if (editor.isActive("video")) {
      const attributes =
        editor.getAttributes("video");

      setVideoUrl(
        typeof attributes.videoUrl === "string"
          ? attributes.videoUrl
          : "",
      );

      setVideoTitle(
        typeof attributes.videoTitle === "string"
          ? attributes.videoTitle
          : "",
      );

      setEditingVideo(true);
    } else {
      setVideoUrl("");
      setVideoTitle("");
      setEditingVideo(false);
    }

    setIsVideoDialogOpen(true);
  }

  function closeVideoDialog() {
    setIsVideoDialogOpen(false);
    setVideoError(null);
    setVideoUrl("");
    setVideoTitle("");
    setEditingVideo(false);

    requestAnimationFrame(() => {
      editor?.commands.focus();
    });
  }

  /**
   * IMPORTANT :
   *
   * Cette fonction n'est volontairement PAS un submit de formulaire.
   *
   * FormationDescriptionEditor est déjà rendu à l'intérieur du formulaire
   * principal de FormationForm.
   *
   * La fenêtre vidéo utilise donc un simple conteneur <div> et ce handler
   * est appelé directement par un bouton type="button".
   *
   * Cela évite complètement :
   *
   * <form>
   *   ...
   *   <form>...</form>
   * </form>
   *
   * qui est interdit en HTML et provoque une erreur d'hydratation React.
   */
  function handleVideoSubmit() {
    if (!editor || disabled) {
      return;
    }

    setVideoError(null);

    const parsedVideo =
      parsePublicVideoUrl(videoUrl);

    if (!parsedVideo) {
      setVideoError(
        "Lien vidéo invalide. Utilisez une URL publique YouTube ou Vimeo valide.",
      );

      return;
    }

    const normalizedTitle =
      normalizeOptionalText(videoTitle) ||
      "Vidéo de démonstration";

    let inserted = false;

    if (
      editingVideo &&
      editor.isActive("video")
    ) {
      inserted = editor
        .chain()
        .focus()
        .updateAttributes("video", {
          provider: parsedVideo.provider,
          videoId: parsedVideo.videoId,
          videoUrl: parsedVideo.videoUrl,
          videoTitle: normalizedTitle,
        })
        .run();
    } else {
      inserted = editor
        .chain()
        .focus()
        .insertContent({
          type: "video",

          attrs: {
            provider: parsedVideo.provider,
            videoId: parsedVideo.videoId,
            videoUrl: parsedVideo.videoUrl,
            videoTitle: normalizedTitle,
          },
        })
        .createParagraphNear()
        .focus()
        .run();
    }

    if (!inserted) {
      setVideoError(
        editingVideo
          ? "Impossible de modifier cette vidéo."
          : "Impossible d'insérer cette vidéo dans la description.",
      );

      return;
    }

    setIsVideoDialogOpen(false);
    setVideoError(null);
    setVideoUrl("");
    setVideoTitle("");
    setEditingVideo(false);
  }

  function removeSelectedVideo() {
    if (!editor || disabled) {
      return;
    }

    if (!editor.isActive("video")) {
      return;
    }

    editor
      .chain()
      .focus()
      .deleteSelection()
      .run();

    setVideoError(null);
    setIsVideoDialogOpen(false);
    setVideoUrl("");
    setVideoTitle("");
    setEditingVideo(false);
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

  const hasSelectedVideo =
    editor.isActive("video");

  const hasError =
    Boolean(imageError) ||
    Boolean(videoError);

  return (
    <div className="w-full">
      <div
        className={[
          "overflow-hidden",
          "rounded-2xl",
          "border",

          hasError
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
              active={editor.isActive(
                "heading",
                { level: 2 },
              )}
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
              active={editor.isActive(
                "heading",
                { level: 3 },
              )}
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
              active={editor.isActive(
                "bulletList",
              )}
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
              active={editor.isActive(
                "orderedList",
              )}
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
              active={editor.isActive(
                "blockquote",
              )}
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

            <ToolbarButton
              label={
                hasSelectedVideo
                  ? "Modifier la vidéo"
                  : "Ajouter une vidéo"
              }
              title={
                hasSelectedVideo
                  ? "Modifier la vidéo sélectionnée"
                  : "Ajouter une vidéo YouTube ou Vimeo"
              }
              active={hasSelectedVideo}
              disabled={disabled}
              onClick={openVideoDialog}
              emphasized={!hasSelectedVideo}
            >
              {hasSelectedVideo
                ? "▶ Modifier vidéo"
                : "＋ Vidéo"}
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
                Supprimer image
              </ToolbarButton>
            ) : null}

            {hasSelectedVideo ? (
              <ToolbarButton
                label="Supprimer la vidéo"
                title="Supprimer la vidéo sélectionnée"
                active={false}
                disabled={disabled}
                onClick={removeSelectedVideo}
                danger
              >
                Supprimer vidéo
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
            Images JPG, PNG ou WEBP · Vidéos
            YouTube ou Vimeo.
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

      {videoError && !isVideoDialogOpen ? (
        <div
          role="alert"
          className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium leading-5 text-red-700"
        >
          {videoError}
        </div>
      ) : null}

      {isVideoDialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeVideoDialog();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="afriskill-video-dialog-title"
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
              <div>
                <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
                  Vidéo de démonstration
                </p>

                <h3
                  id="afriskill-video-dialog-title"
                  className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl"
                >
                  {editingVideo
                    ? "Modifier la vidéo"
                    : "Ajouter une vidéo"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Collez un lien public YouTube
                  ou Vimeo. La vidéo apparaîtra
                  exactement à cet endroit dans
                  la description.
                </p>
              </div>

              <button
                type="button"
                onClick={closeVideoDialog}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fermer"
                title="Fermer"
              >
                ×
              </button>
            </div>

            {/*
             * IMPORTANT :
             * ce bloc est volontairement un <div> et non un <form>.
             *
             * FormationDescriptionEditor est déjà rendu dans le
             * <form> principal de FormationForm.
             *
             * Un second <form> ici créerait un formulaire imbriqué
             * et provoquerait l'erreur d'hydratation React.
             */}
            <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              <div>
                <label
                  htmlFor="afriskill-video-url"
                  className="mb-2 block text-sm font-extrabold text-slate-900"
                >
                  Lien de la vidéo
                </label>

                <input
                  id="afriskill-video-url"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  autoFocus
                  required
                  value={videoUrl}
                  onChange={(event) => {
                    setVideoUrl(
                      event.target.value,
                    );

                    setVideoError(null);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      event.preventDefault();
                      handleVideoSubmit();
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Formats acceptés : YouTube,
                  YouTube Shorts, youtu.be et
                  Vimeo.
                </p>
              </div>

              <div>
                <label
                  htmlFor="afriskill-video-title"
                  className="mb-2 block text-sm font-extrabold text-slate-900"
                >
                  Titre de la vidéo

                  <span className="ml-1 font-medium text-slate-400">
                    (optionnel)
                  </span>
                </label>

                <input
                  id="afriskill-video-title"
                  type="text"
                  maxLength={160}
                  value={videoTitle}
                  onChange={(event) => {
                    setVideoTitle(
                      event.target.value,
                    );

                    setVideoError(null);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      event.preventDefault();
                      handleVideoSubmit();
                    }
                  }}
                  placeholder="Ex. Aperçu de la formation"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {videoUrl.trim() ? (
                <VideoPreview
                  url={videoUrl}
                  title={
                    videoTitle.trim() ||
                    "Vidéo de démonstration"
                  }
                />
              ) : null}

              {videoError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
                >
                  {videoError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeVideoDialog}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-100"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleVideoSubmit}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white transition hover:bg-slate-800"
                >
                  {editingVideo
                    ? "Enregistrer les modifications"
                    : "Ajouter la vidéo"}
                </button>
              </div>
            </div>
          </div>
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

        .afriskill-description-video {
          display: block;
          margin: 1.5rem 0;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          background: #0f172a;
          overflow: hidden;
          cursor: pointer;
          user-select: none;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.08),
            0 12px 30px rgba(15, 23, 42, 0.12);
        }

        .afriskill-description-video__preview {
          display: flex;
          min-height: 180px;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem;
          background:
            radial-gradient(
              circle at top right,
              rgba(37, 99, 235, 0.35),
              transparent 40%
            ),
            linear-gradient(
              135deg,
              #020617,
              #0f172a
            );
          color: #ffffff;
        }

        .afriskill-description-video__play {
          display: flex;
          width: 3.5rem;
          height: 3.5rem;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: #ffffff;
          padding-left: 0.2rem;
          color: #0f172a;
          font-size: 1.15rem;
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.25);
        }

        .afriskill-description-video__content {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 0.2rem;
        }

        .afriskill-description-video__title {
          overflow: hidden;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 800;
          line-height: 1.4;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .afriskill-description-video__provider {
          color: #cbd5e1;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .afriskill-description-video.ProseMirror-selectednode {
          outline: 3px solid rgba(37, 99, 235, 0.5);
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

          .afriskill-description-video {
            margin: 1.25rem 0;
            border-radius: 0.85rem;
          }

          .afriskill-description-video__preview {
            min-height: 150px;
            padding: 1.5rem;
          }

          .afriskill-description-video__play {
            width: 3rem;
            height: 3rem;
          }
        }
      `}</style>
    </div>
  );
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

function VideoPreview({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const parsedVideo =
    parsePublicVideoUrl(url);

  if (!parsedVideo) {
    return null;
  }

  const embedUrl =
    buildVideoEmbedUrl(parsedVideo);

  if (!embedUrl) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
      <div className="relative aspect-video w-full">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

function parsePublicVideoUrl(
  value: string,
): ParsedVideo | null {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(normalizedValue);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") {
    return null;
  }

  const hostname =
    normalizeHostname(url.hostname);

  const youtubeVideoId =
    extractYouTubeVideoId(
      url,
      hostname,
    );

  if (youtubeVideoId) {
    return {
      provider: "youtube",
      videoId: youtubeVideoId,

      videoUrl:
        `https://www.youtube.com/watch?v=${encodeURIComponent(
          youtubeVideoId,
        )}`,
    };
  }

  const vimeoVideoId =
    extractVimeoVideoId(
      url,
      hostname,
    );

  if (vimeoVideoId) {
    return {
      provider: "vimeo",
      videoId: vimeoVideoId,

      videoUrl:
        `https://vimeo.com/${encodeURIComponent(
          vimeoVideoId,
        )}`,
    };
  }

  return null;
}

function extractYouTubeVideoId(
  url: URL,
  hostname: string,
): string | null {
  let candidate = "";

  if (
    hostname === "youtu.be"
  ) {
    candidate =
      url.pathname
        .split("/")
        .filter(Boolean)[0] ?? "";
  } else if (
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com")
  ) {
    if (url.pathname === "/watch") {
      candidate =
        url.searchParams.get("v") ?? "";
    } else {
      const segments =
        url.pathname
          .split("/")
          .filter(Boolean);

      if (
        segments[0] === "shorts" ||
        segments[0] === "embed" ||
        segments[0] === "live"
      ) {
        candidate =
          segments[1] ?? "";
      }
    }
  }

  const normalizedCandidate =
    candidate.trim();

  return isValidYouTubeVideoId(
    normalizedCandidate,
  )
    ? normalizedCandidate
    : null;
}

function extractVimeoVideoId(
  url: URL,
  hostname: string,
): string | null {
  if (
    hostname !== "vimeo.com" &&
    !hostname.endsWith(".vimeo.com")
  ) {
    return null;
  }

  const segments =
    url.pathname
      .split("/")
      .filter(Boolean);

  for (
    let index = segments.length - 1;
    index >= 0;
    index -= 1
  ) {
    const candidate =
      segments[index]?.trim() ?? "";

    if (
      isValidVimeoVideoId(candidate)
    ) {
      return candidate;
    }
  }

  return null;
}

function buildVideoEmbedUrl(
  video: ParsedVideo,
): string | null {
  if (
    video.provider === "youtube" &&
    isValidYouTubeVideoId(video.videoId)
  ) {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
      video.videoId,
    )}`;
  }

  if (
    video.provider === "vimeo" &&
    isValidVimeoVideoId(video.videoId)
  ) {
    return `https://player.vimeo.com/video/${encodeURIComponent(
      video.videoId,
    )}`;
  }

  return null;
}

function normalizeHostname(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
}

function isValidYouTubeVideoId(
  value: string,
): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(
    value,
  );
}

function isValidVimeoVideoId(
  value: string,
): boolean {
  return /^\d{5,15}$/.test(value);
}

function buildInitialContent(
  value: JSONContent | null | undefined,
  fallbackText: string,
): JSONContent {
  if (isUsableDocument(value)) {
    return value;
  }

  if (fallbackText.trim()) {
    return buildDocumentFromText(
      fallbackText,
    );
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
    .map((paragraph) =>
      paragraph.trim(),
    )
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
              const nodes: JSONContent[] =
                [];

              if (line) {
                nodes.push({
                  type: "text",
                  text: line,
                });
              }

              if (
                index <
                array.length - 1
              ) {
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
  if (
    !ACCEPTED_IMAGE_TYPES.has(file.type)
  ) {
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
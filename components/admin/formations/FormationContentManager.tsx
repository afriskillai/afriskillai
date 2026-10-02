"use client";

import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";

export type LessonType =
  | "video"
  | "pdf"
  | "link"
  | "text";

export type FormationLesson = {
  id: string;
  title: string;
  type: LessonType;
  position: number;
  durationMinutes?: number | null;
  resourceUrl?: string | null;
  isPublished: boolean;
};

export type FormationModule = {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  lessons: FormationLesson[];
};

export type FormationContentData = {
  modules: FormationModule[];
};

type FormationContentManagerProps = {
  formationId: string;
  initialData?: FormationContentData;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
};

const emptyContent: FormationContentData = {
  modules: [],
};

export default function FormationContentManager({
  formationId,
  initialData = emptyContent,
}: FormationContentManagerProps) {
  /*
   * Le contenu affiché provient actuellement des données
   * initiales fournies par le serveur.
   *
   * Après une création réussie, la page est rechargée afin
   * de récupérer l'état réel depuis le serveur.
   *
   * Il n'est donc pas nécessaire de conserver un setter
   * local inutilisé pour ces données.
   */
  const data = initialData;

  const [expandedModules, setExpandedModules] =
    useState<Set<string>>(
      () =>
        new Set(
          initialData.modules.map(
            (module) => module.id,
          ),
        ),
    );

  const [moduleModalOpen, setModuleModalOpen] =
    useState(false);

  const [lessonModuleId, setLessonModuleId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const totals = useMemo(() => {
    const modules = data.modules.length;

    const lessons = data.modules.reduce(
      (sum, module) =>
        sum + module.lessons.length,
      0,
    );

    const publishedLessons = data.modules.reduce(
      (sum, module) =>
        sum +
        module.lessons.filter(
          (lesson) => lesson.isPublished,
        ).length,
      0,
    );

    return {
      modules,
      lessons,
      publishedLessons,
    };
  }, [data]);

  function toggleModule(moduleId: string) {
    setExpandedModules((current) => {
      const next = new Set(current);

      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }

      return next;
    });
  }

  async function createModule(title: string) {
    if (isSaving) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/admin/formations/${encodeURIComponent(
          formationId,
        )}/modules`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
          }),
        },
      );

      const result =
        await parseApiResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Impossible de créer le module.",
        );
      }

      /*
       * Après création réelle, l'API devient la source
       * de vérité.
       *
       * Le rechargement garantit que les identifiants,
       * positions et autres données affichées proviennent
       * bien du serveur.
       */
      window.location.reload();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de créer le module.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function createLesson(
    moduleId: string,
    values: {
      title: string;
      type: LessonType;
    },
  ) {
    if (isSaving) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/admin/formations/${encodeURIComponent(
          formationId,
        )}/modules/${encodeURIComponent(
          moduleId,
        )}/lessons`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        },
      );

      const result =
        await parseApiResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Impossible de créer la leçon.",
        );
      }

      /*
       * Comme pour les modules, on recharge les données
       * depuis le serveur après une création réussie.
       */
      window.location.reload();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de créer la leçon.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid gap-4 sm:grid-cols-3">
          <ContentStat
            label="Modules"
            value={totals.modules}
          />

          <ContentStat
            label="Leçons"
            value={totals.lessons}
          />

          <ContentStat
            label="Leçons publiées"
            value={totals.publishedLessons}
          />
        </div>

        {/* Barre d'actions */}
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold text-slate-950">
                Programme de la formation
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Structurez votre formation en modules et
                leçons.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setModuleModalOpen(true)
              }
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusIcon />
              Ajouter un module
            </button>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          ) : null}
        </section>

        {data.modules.length === 0 ? (
          <EmptyContent
            onAddModule={() =>
              setModuleModalOpen(true)
            }
          />
        ) : (
          <div className="space-y-4">
            {data.modules
              .slice()
              .sort(
                (a, b) =>
                  a.position - b.position,
              )
              .map((module, moduleIndex) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  index={moduleIndex}
                  expanded={expandedModules.has(
                    module.id,
                  )}
                  onToggle={() =>
                    toggleModule(module.id)
                  }
                  onAddLesson={() =>
                    setLessonModuleId(module.id)
                  }
                />
              ))}
          </div>
        )}

        <section className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <ShieldIcon />
            </div>

            <div>
              <p className="text-sm font-bold text-blue-950">
                Accès réservé aux acheteurs
              </p>

              <p className="mt-1 text-xs leading-6 text-blue-700/70">
                Le contenu pédagogique devra être accessible
                uniquement aux utilisateurs possédant une
                inscription valide à cette formation.
              </p>
            </div>
          </div>
        </section>
      </div>

      {moduleModalOpen ? (
        <ModuleModal
          loading={isSaving}
          onClose={() =>
            setModuleModalOpen(false)
          }
          onSubmit={async (title) => {
            await createModule(title);
          }}
        />
      ) : null}

      {lessonModuleId ? (
        <LessonModal
          loading={isSaving}
          onClose={() =>
            setLessonModuleId(null)
          }
          onSubmit={async (values) => {
            await createLesson(
              lessonModuleId,
              values,
            );
          }}
        />
      ) : null}
    </>
  );
}

function ModuleCard({
  module,
  index,
  expanded,
  onToggle,
  onAddLesson,
}: {
  module: FormationModule;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onAddLesson: () => void;
}) {
  const lessons = module.lessons
    .slice()
    .sort(
      (a, b) => a.position - b.position,
    );

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
          aria-expanded={expanded}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
            {index + 1}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-slate-900">
              {module.title}
            </span>

            <span className="mt-1 block text-xs text-slate-400">
              {lessons.length} leçon
              {lessons.length > 1 ? "s" : ""}
            </span>
          </span>

          <ChevronIcon open={expanded} />
        </button>

        <button
          type="button"
          onClick={onAddLesson}
          className="hidden h-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100 sm:inline-flex"
        >
          + Leçon
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-slate-100">
          {module.description ? (
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 text-sm leading-6 text-slate-500">
              {module.description}
            </div>
          ) : null}

          {lessons.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-slate-500">
                Aucune leçon dans ce module.
              </p>

              <button
                type="button"
                onClick={onAddLesson}
                className="mt-3 text-sm font-bold text-blue-600"
              >
                Ajouter la première leçon
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lessons.map(
                (lesson, lessonIndex) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    index={lessonIndex}
                  />
                ),
              )}
            </div>
          )}

          <div className="border-t border-slate-100 p-4 sm:hidden">
            <button
              type="button"
              onClick={onAddLesson}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700"
            >
              + Ajouter une leçon
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LessonRow({
  lesson,
  index,
}: {
  lesson: FormationLesson;
  index: number;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500">
        {index + 1}
      </span>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <LessonTypeIcon type={lesson.type} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {lesson.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span>
            {getLessonTypeLabel(
              lesson.type,
            )}
          </span>

          {lesson.durationMinutes ? (
            <>
              <span>•</span>

              <span>
                {lesson.durationMinutes} min
              </span>
            </>
          ) : null}
        </div>
      </div>

      <span
        className={[
          "rounded-full px-2.5 py-1 text-[10px] font-bold",
          lesson.isPublished
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700",
        ].join(" ")}
      >
        {lesson.isPublished
          ? "Publiée"
          : "Brouillon"}
      </span>
    </div>
  );
}

function ModuleModal({
  loading,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalized = title.trim();

    if (normalized.length < 2) {
      return;
    }

    await onSubmit(normalized);
  }

  return (
    <ModalFrame
      title="Ajouter un module"
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="module-title"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Nom du module
          </label>

          <input
            id="module-title"
            autoFocus
            maxLength={150}
            value={title}
            disabled={loading}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Ex. Découvrir ChatGPT"
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <ModalActions
          loading={loading}
          submitLabel="Créer le module"
          onCancel={onClose}
        />
      </form>
    </ModalFrame>
  );
}

function LessonModal({
  loading,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: {
    title: string;
    type: LessonType;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");

  const [type, setType] =
    useState<LessonType>("video");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalized = title.trim();

    if (normalized.length < 2) {
      return;
    }

    await onSubmit({
      title: normalized,
      type,
    });
  }

  return (
    <ModalFrame
      title="Ajouter une leçon"
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="lesson-title"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Nom de la leçon
          </label>

          <input
            id="lesson-title"
            autoFocus
            maxLength={150}
            value={title}
            disabled={loading}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Ex. Créer son premier prompt"
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div>
          <label
            htmlFor="lesson-type"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Type de contenu
          </label>

          <select
            id="lesson-type"
            value={type}
            disabled={loading}
            onChange={(event) =>
              setType(
                event.target
                  .value as LessonType,
              )
            }
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="video">
              Vidéo
            </option>

            <option value="pdf">
              Document PDF
            </option>

            <option value="link">
              Ressource / lien
            </option>

            <option value="text">
              Contenu texte
            </option>
          </select>
        </div>

        <ModalActions
          loading={loading}
          submitLabel="Créer la leçon"
          onCancel={onClose}
        />
      </form>
    </ModalFrame>
  );
}

function ModalFrame({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-950">
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <CloseIcon />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function ModalActions({
  loading,
  submitLabel,
  onCancel,
}: {
  loading: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Annuler
      </button>

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
        ) : null}

        {loading
          ? "Enregistrement..."
          : submitLabel}
      </button>
    </div>
  );
}

function ContentStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function EmptyContent({
  onAddModule,
}: {
  onAddModule: () => void;
}) {
  return (
    <section className="flex min-h-[350px] items-center justify-center rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <ContentIcon />
        </div>

        <h3 className="mt-5 font-bold text-slate-900">
          Programme vide
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Créez votre premier module puis ajoutez
          progressivement les différentes leçons.
        </p>

        <button
          type="button"
          onClick={onAddModule}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white"
        >
          <PlusIcon />
          Créer le premier module
        </button>
      </div>
    </section>
  );
}

async function parseApiResponse(
  response: Response,
): Promise<ApiResponse> {
  try {
    return (await response.json()) as ApiResponse;
  } catch {
    return {};
  }
}

function getLessonTypeLabel(
  type: LessonType,
) {
  return {
    video: "Vidéo",
    pdf: "PDF",
    link: "Ressource",
    text: "Texte",
  }[type];
}

function LessonTypeIcon({
  type,
}: {
  type: LessonType;
}) {
  if (type === "video") {
    return (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />
        <path d="m10 9 5 3-5 3Z" />
      </svg>
    );
  }

  if (type === "pdf") {
    return (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M6 2h8l4 4v16H6Z" />
        <path d="M14 2v5h5" />
      </svg>
    );
  }

  if (type === "link") {
    return (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
      </svg>
    );
  }

  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ContentIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
      />
      <path d="m10 9 5 3-5 3Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6Z" />
      <path d="m9.5 12 1.5 1.5 3.5-4" />
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
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 text-slate-400 transition ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}
import type { ReactNode } from "react";

import {
  getPublicCourseDescriptionFallback,
  publicCourseHasRichDescription,
  type PublicCourseDescriptionDocument,
  type PublicCourseDescriptionMark,
  type PublicCourseDescriptionNode,
  type PublicCourseDetail,
} from "@/types/public-course";

/**
 * ============================================================================
 * AFRISKILL AI — FORMATION DESCRIPTION RENDERER
 * ============================================================================
 *
 * Renderer public de la description enrichie d'une formation.
 *
 * Principes :
 * - aucun dangerouslySetInnerHTML ;
 * - aucun HTML arbitraire venant de la base ;
 * - aucun import de l'éditeur TipTap ;
 * - rendu uniquement des nœuds autorisés par nos types publics ;
 * - conservation exacte de l'ordre texte / image / texte ;
 * - fallback vers la description texte historique ;
 * - compatible Server Component ;
 * - responsive par défaut.
 * ============================================================================
 */

type FormationDescriptionRendererProps = {
  course: Pick<
    PublicCourseDetail,
    | "title"
    | "description"
    | "descriptionContent"
  >;
  className?: string;
};

type RenderNodeContext = {
  courseTitle: string;
};

type TextMarkRendererProps = {
  children: ReactNode;
  marks:
    | PublicCourseDescriptionMark[]
    | null
    | undefined;
};

function joinClassNames(
  ...values: Array<
    string | null | undefined | false
  >
): string {
  return values
    .filter(Boolean)
    .join(" ");
}

/**
 * Vérifie qu'une URL d'image peut être rendue
 * publiquement.
 *
 * Les URLs sont déjà normalisées dans lib/public-courses.ts,
 * mais cette vérification constitue une seconde barrière
 * au niveau du renderer.
 */
function isAllowedImageUrl(
  value: string | null | undefined,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const normalizedValue =
    value.trim();

  if (!normalizedValue) {
    return false;
  }

  return (
    normalizedValue.startsWith("https://") ||
    normalizedValue.startsWith("http://") ||
    normalizedValue.startsWith("/")
  );
}

/**
 * Vérifie qu'un lien public peut être rendu.
 */
function isAllowedLinkUrl(
  value: string | null | undefined,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const normalizedValue =
    value.trim();

  return (
    normalizedValue.startsWith("https://") ||
    normalizedValue.startsWith("http://")
  );
}

/**
 * Applique les marques de texte dans leur ordre.
 *
 * Exemple :
 * text
 *   -> bold
 *   -> italic
 *   -> link
 */
function TextMarkRenderer({
  children,
  marks,
}: TextMarkRendererProps) {
  if (
    !marks ||
    marks.length === 0
  ) {
    return <>{children}</>;
  }

  return marks.reduce<ReactNode>(
    (content, mark, index) => {
      const key =
        `${mark.type}-${index}`;

      switch (mark.type) {
        case "bold":
          return (
            <strong
              key={key}
              className="font-extrabold text-slate-950"
            >
              {content}
            </strong>
          );

        case "italic":
          return (
            <em
              key={key}
              className="italic"
            >
              {content}
            </em>
          );

        case "strike":
          return (
            <s
              key={key}
              className="decoration-slate-500"
            >
              {content}
            </s>
          );

        case "code":
          return (
            <code
              key={key}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] font-semibold text-slate-900"
            >
              {content}
            </code>
          );

        case "link": {
          const href =
            mark.attrs?.href;

          if (
            !isAllowedLinkUrl(href)
          ) {
            return content;
          }

          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-700 underline decoration-blue-300 decoration-2 underline-offset-4 transition-colors hover:text-blue-900"
            >
              {content}
            </a>
          );
        }

        default:
          return content;
      }
    },
    children,
  );
}

/**
 * Rend récursivement le contenu enfant d'un nœud.
 */
function renderChildren(
  node: PublicCourseDescriptionNode,
  context: RenderNodeContext,
  path: string,
): ReactNode {
  if (
    !Array.isArray(node.content) ||
    node.content.length === 0
  ) {
    return null;
  }

  return node.content.map(
    (child, index) =>
      renderNode(
        child,
        context,
        `${path}-${index}`,
      ),
  );
}

/**
 * Rend un titre de description.
 */
function renderHeading(
  node: PublicCourseDescriptionNode,
  context: RenderNodeContext,
  path: string,
): ReactNode {
  const children =
    renderChildren(
      node,
      context,
      path,
    );

  const rawLevel =
    node.attrs?.level;

  const level =
    typeof rawLevel === "number"
      ? Math.max(
          1,
          Math.min(
            6,
            Math.floor(rawLevel),
          ),
        )
      : 2;

  switch (level) {
    case 1:
      return (
        <h2
          key={path}
          className="mb-5 mt-10 text-3xl font-black tracking-tight text-slate-950 first:mt-0 sm:text-4xl"
        >
          {children}
        </h2>
      );

    case 2:
      return (
        <h2
          key={path}
          className="mb-4 mt-9 text-2xl font-black tracking-tight text-slate-950 first:mt-0 sm:text-3xl"
        >
          {children}
        </h2>
      );

    case 3:
      return (
        <h3
          key={path}
          className="mb-3 mt-8 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl"
        >
          {children}
        </h3>
      );

    case 4:
      return (
        <h4
          key={path}
          className="mb-3 mt-7 text-lg font-extrabold text-slate-950 sm:text-xl"
        >
          {children}
        </h4>
      );

    case 5:
      return (
        <h5
          key={path}
          className="mb-2 mt-6 text-base font-extrabold text-slate-950 sm:text-lg"
        >
          {children}
        </h5>
      );

    default:
      return (
        <h6
          key={path}
          className="mb-2 mt-5 text-sm font-extrabold uppercase tracking-wide text-slate-800 sm:text-base"
        >
          {children}
        </h6>
      );
  }
}

/**
 * Rend une image intégrée exactement à la position
 * où elle apparaît dans descriptionContent.
 */
function renderDescriptionImage(
  node: PublicCourseDescriptionNode,
  context: RenderNodeContext,
  path: string,
): ReactNode {
  const src =
    node.attrs?.src;

  if (!isAllowedImageUrl(src)) {
    return null;
  }

  const alt =
    typeof node.attrs?.alt === "string" &&
    node.attrs.alt.trim()
      ? node.attrs.alt.trim()
      : `Illustration de la formation ${context.courseTitle}`;

  const caption =
    typeof node.attrs?.title === "string" &&
    node.attrs.title.trim()
      ? node.attrs.title.trim()
      : null;

  return (
    <figure
      key={path}
      className="my-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:my-10 sm:rounded-3xl"
    >
      {/*
       * On utilise volontairement <img> ici :
       * les images de description peuvent provenir du stockage public
       * configuré pour les formations et leurs dimensions sont variables.
       *
       * Cela évite d'imposer une configuration next/image différente
       * de celle déjà présente dans le projet.
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="block h-auto max-h-[760px] w-full object-contain"
      />

      {caption ? (
        <figcaption className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center text-sm leading-6 text-slate-600 sm:px-6">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * Renderer principal d'un nœud structuré.
 */
function renderNode(
  node: PublicCourseDescriptionNode,
  context: RenderNodeContext,
  path: string,
): ReactNode {
  switch (node.type) {
    case "doc":
      return (
        <div key={path}>
          {renderChildren(
            node,
            context,
            path,
          )}
        </div>
      );

    case "paragraph":
      return (
        <p
          key={path}
          className="my-5 text-[1.02rem] leading-8 text-slate-700 first:mt-0 sm:text-[1.075rem] sm:leading-8"
        >
          {renderChildren(
            node,
            context,
            path,
          )}
        </p>
      );

    case "text":
      return (
        <TextMarkRenderer
          key={path}
          marks={node.marks}
        >
          {node.text ?? ""}
        </TextMarkRenderer>
      );

    case "heading":
      return renderHeading(
        node,
        context,
        path,
      );

    case "bulletList":
      return (
        <ul
          key={path}
          className="my-6 list-disc space-y-2.5 pl-6 text-[1.02rem] leading-8 text-slate-700 marker:text-slate-900 sm:pl-8 sm:text-[1.075rem]"
        >
          {renderChildren(
            node,
            context,
            path,
          )}
        </ul>
      );

    case "orderedList":
      return (
        <ol
          key={path}
          className="my-6 list-decimal space-y-2.5 pl-6 text-[1.02rem] leading-8 text-slate-700 marker:font-bold marker:text-slate-900 sm:pl-8 sm:text-[1.075rem]"
        >
          {renderChildren(
            node,
            context,
            path,
          )}
        </ol>
      );

    case "listItem":
      return (
        <li
          key={path}
          className="pl-1"
        >
          {renderChildren(
            node,
            context,
            path,
          )}
        </li>
      );

    case "blockquote":
      return (
        <blockquote
          key={path}
          className="my-8 rounded-r-2xl border-l-4 border-slate-900 bg-slate-50 px-5 py-4 text-[1.02rem] leading-8 text-slate-700 sm:px-6 sm:text-[1.075rem]"
        >
          {renderChildren(
            node,
            context,
            path,
          )}
        </blockquote>
      );

    case "hardBreak":
      return <br key={path} />;

    case "horizontalRule":
      return (
        <hr
          key={path}
          className="my-10 border-0 border-t border-slate-200"
        />
      );

    case "image":
      return renderDescriptionImage(
        node,
        context,
        path,
      );

    default:
      return null;
  }
}

/**
 * Rend le document enrichi complet.
 */
function renderRichDescription(
  document: PublicCourseDescriptionDocument,
  courseTitle: string,
): ReactNode {
  if (
    !Array.isArray(document.content) ||
    document.content.length === 0
  ) {
    return null;
  }

  const context: RenderNodeContext = {
    courseTitle:
      courseTitle.trim() ||
      "AfriSkill AI",
  };

  return document.content.map(
    (node, index) =>
      renderNode(
        node,
        context,
        `description-${index}`,
      ),
  );
}

/**
 * Rend l'ancienne description texte lorsque
 * descriptionContent n'existe pas.
 *
 * Les retours à la ligne doubles deviennent des paragraphes.
 * Les retours simples sont conservés grâce à whitespace-pre-line.
 */
function renderFallbackDescription(
  description: string,
): ReactNode {
  const paragraphs =
    description
      .split(/\n\s*\n/g)
      .map((paragraph) =>
        paragraph.trim(),
      )
      .filter(Boolean);

  if (paragraphs.length === 0) {
    return null;
  }

  return paragraphs.map(
    (paragraph, index) => (
      <p
        key={`fallback-${index}`}
        className="my-5 whitespace-pre-line text-[1.02rem] leading-8 text-slate-700 first:mt-0 sm:text-[1.075rem] sm:leading-8"
      >
        {paragraph}
      </p>
    ),
  );
}

/**
 * ============================================================================
 * COMPOSANT PUBLIC
 * ============================================================================
 */

export default function FormationDescriptionRenderer({
  course,
  className,
}: FormationDescriptionRendererProps) {
  const hasRichDescription =
    publicCourseHasRichDescription({
      descriptionContent:
        course.descriptionContent,
    });

  const fallbackDescription =
    getPublicCourseDescriptionFallback({
      description:
        course.description,
    });

  const hasFallbackDescription =
    fallbackDescription.length > 0;

  if (
    !hasRichDescription &&
    !hasFallbackDescription
  ) {
    return null;
  }

  return (
    <section
      aria-labelledby="formation-description-title"
      className={joinClassNames(
        "w-full",
        className,
      )}
    >
      <div className="mb-7 sm:mb-9">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
          Présentation
        </p>

        <h2
          id="formation-description-title"
          className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl"
        >
          À propos de cette formation
        </h2>
      </div>

      <div className="max-w-none">
        {hasRichDescription &&
        course.descriptionContent
          ? renderRichDescription(
              course.descriptionContent,
              course.title,
            )
          : renderFallbackDescription(
              fallbackDescription,
            )}
      </div>
    </section>
  );
}
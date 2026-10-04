import type { ReactNode } from "react";

import {
  getPublicCourseDescriptionFallback,
  getPublicCourseDescriptionVideoTitle,
  isPublicCourseDescriptionVideoProvider,
  publicCourseHasRichDescription,
  type PublicCourseDescriptionDocument,
  type PublicCourseDescriptionMark,
  type PublicCourseDescriptionNode,
  type PublicCourseDescriptionVideoProvider,
  type PublicCourseDetail,
} from "@/types/public-course";

/**
 * ============================================================================
 * AFRISKILL AI — FORMATION DESCRIPTION RENDERER
 * ============================================================================
 *
 * Renderer public sécurisé de la description enrichie.
 *
 * Supporte :
 * - texte ;
 * - titres ;
 * - listes ;
 * - citations ;
 * - séparateurs ;
 * - images ;
 * - vidéos YouTube ;
 * - vidéos Vimeo ;
 * - anciennes vidéos enregistrées uniquement avec videoUrl ;
 * - fallback vers la description texte historique.
 *
 * Sécurité :
 * - aucun dangerouslySetInnerHTML ;
 * - aucun HTML arbitraire ;
 * - aucune iframe arbitraire ;
 * - YouTube et Vimeo uniquement ;
 * - reconstruction serveur des URLs d'embed.
 *
 * ============================================================================
 */

type FormationDescriptionRendererProps = {
  course: Pick<
    PublicCourseDetail,
    "title" | "description" | "descriptionContent"
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

type ValidatedPublicVideo = {
  provider: PublicCourseDescriptionVideoProvider;
  videoId: string;
  embedUrl: string;
  canonicalUrl: string;
};

function joinClassNames(
  ...values: Array<string | null | undefined | false>
): string {
  return values.filter(Boolean).join(" ");
}

/* ============================================================================
 * URLS
 * ============================================================================
 */

function isAllowedImageUrl(
  value: string | null | undefined,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return false;
  }

  return (
    normalizedValue.startsWith("https://") ||
    normalizedValue.startsWith("http://") ||
    normalizedValue.startsWith("/")
  );
}

function isAllowedLinkUrl(
  value: string | null | undefined,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const normalizedValue = value.trim();

  return (
    normalizedValue.startsWith("https://") ||
    normalizedValue.startsWith("http://")
  );
}

/* ============================================================================
 * TEXT MARKS
 * ============================================================================
 */

function TextMarkRenderer({
  children,
  marks,
}: TextMarkRendererProps) {
  if (!marks || marks.length === 0) {
    return <>{children}</>;
  }

  return marks.reduce<ReactNode>(
    (content, mark, index) => {
      const key = `${mark.type}-${index}`;

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
            <em key={key} className="italic">
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
          const href = mark.attrs?.href;

          if (!isAllowedLinkUrl(href)) {
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

/* ============================================================================
 * CHILDREN
 * ============================================================================
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

  return node.content.map((child, index) =>
    renderNode(
      child,
      context,
      `${path}-${index}`,
    ),
  );
}

/* ============================================================================
 * HEADINGS
 * ============================================================================
 */

function renderHeading(
  node: PublicCourseDescriptionNode,
  context: RenderNodeContext,
  path: string,
): ReactNode {
  const children = renderChildren(
    node,
    context,
    path,
  );

  const rawLevel = node.attrs?.level;

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

/* ============================================================================
 * IMAGES
 * ============================================================================
 */

function renderDescriptionImage(
  node: PublicCourseDescriptionNode,
  context: RenderNodeContext,
  path: string,
): ReactNode {
  const src = node.attrs?.src;

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

/* ============================================================================
 * VIDEO HELPERS
 * ============================================================================
 */

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

function extractYouTubeVideoId(
  rawUrl: string,
): string | null {
  const value = rawUrl.trim();

  if (!value) {
    return null;
  }

  /*
   * Accepte également un ID YouTube direct.
   */
  if (isValidYouTubeVideoId(value)) {
    return value;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const hostname = url.hostname
    .toLowerCase()
    .replace(/^www\./, "");

  let videoId: string | null = null;

  if (hostname === "youtu.be") {
    videoId =
      url.pathname
        .split("/")
        .filter(Boolean)[0] ?? null;
  }

  if (
    hostname === "youtube.com" ||
    hostname === "m.youtube.com" ||
    hostname === "music.youtube.com" ||
    hostname === "youtube-nocookie.com"
  ) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else {
      const parts = url.pathname
        .split("/")
        .filter(Boolean);

      if (
        parts[0] === "embed" ||
        parts[0] === "shorts" ||
        parts[0] === "live"
      ) {
        videoId = parts[1] ?? null;
      }
    }
  }

  if (
    !videoId ||
    !isValidYouTubeVideoId(videoId)
  ) {
    return null;
  }

  return videoId;
}

function extractVimeoVideoId(
  rawUrl: string,
): string | null {
  const value = rawUrl.trim();

  if (!value) {
    return null;
  }

  /*
   * Accepte également un ID Vimeo direct.
   */
  if (isValidVimeoVideoId(value)) {
    return value;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const hostname = url.hostname
    .toLowerCase()
    .replace(/^www\./, "");

  if (
    hostname !== "vimeo.com" &&
    hostname !== "player.vimeo.com"
  ) {
    return null;
  }

  const parts = url.pathname
    .split("/")
    .filter(Boolean);

  /*
   * On recherche depuis la fin afin de supporter :
   *
   * vimeo.com/123456789
   * player.vimeo.com/video/123456789
   * vimeo.com/channels/.../123456789
   */
  for (
    let index = parts.length - 1;
    index >= 0;
    index -= 1
  ) {
    const candidate = parts[index];

    if (
      candidate &&
      isValidVimeoVideoId(candidate)
    ) {
      return candidate;
    }
  }

  return null;
}

function detectVideoFromUrl(
  rawUrl: string,
): {
  provider: PublicCourseDescriptionVideoProvider;
  videoId: string;
} | null {
  const youtubeVideoId =
    extractYouTubeVideoId(rawUrl);

  if (youtubeVideoId) {
    return {
      provider: "youtube",
      videoId: youtubeVideoId,
    };
  }

  const vimeoVideoId =
    extractVimeoVideoId(rawUrl);

  if (vimeoVideoId) {
    return {
      provider: "vimeo",
      videoId: vimeoVideoId,
    };
  }

  return null;
}

function createValidatedVideo(
  provider: PublicCourseDescriptionVideoProvider,
  videoId: string,
): ValidatedPublicVideo | null {
  const normalizedVideoId =
    videoId.trim();

  if (provider === "youtube") {
    if (
      !isValidYouTubeVideoId(
        normalizedVideoId,
      )
    ) {
      return null;
    }

    return {
      provider,
      videoId: normalizedVideoId,
      embedUrl:
        `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
          normalizedVideoId,
        )}`,
      canonicalUrl:
        `https://www.youtube.com/watch?v=${encodeURIComponent(
          normalizedVideoId,
        )}`,
    };
  }

  if (provider === "vimeo") {
    if (
      !isValidVimeoVideoId(
        normalizedVideoId,
      )
    ) {
      return null;
    }

    return {
      provider,
      videoId: normalizedVideoId,
      embedUrl:
        `https://player.vimeo.com/video/${encodeURIComponent(
          normalizedVideoId,
        )}`,
      canonicalUrl:
        `https://vimeo.com/${encodeURIComponent(
          normalizedVideoId,
        )}`,
    };
  }

  return null;
}

/**
 * Valide une vidéo enregistrée.
 *
 * Deux formats sont supportés :
 *
 * Nouveau format :
 * {
 *   provider: "youtube",
 *   videoId: "...",
 *   videoUrl: "..."
 * }
 *
 * Ancien / format compatible :
 * {
 *   videoUrl: "https://youtube.com/..."
 * }
 *
 * videoUrl n'est jamais directement utilisé comme src d'iframe.
 */
function validatePublicVideo(
  node: PublicCourseDescriptionNode,
): ValidatedPublicVideo | null {
  const provider =
    node.attrs?.provider;

  const rawVideoId =
    node.attrs?.videoId;

  /*
   * 1. Format normalisé provider + videoId.
   */
  if (
    isPublicCourseDescriptionVideoProvider(
      provider,
    ) &&
    typeof rawVideoId === "string" &&
    rawVideoId.trim()
  ) {
    const validated =
      createValidatedVideo(
        provider,
        rawVideoId,
      );

    if (validated) {
      return validated;
    }
  }

  /*
   * 2. Rétrocompatibilité :
   * on récupère provider/videoId depuis videoUrl.
   */
  const rawVideoUrl =
    node.attrs?.videoUrl;

  if (
    typeof rawVideoUrl === "string" &&
    rawVideoUrl.trim()
  ) {
    const detected =
      detectVideoFromUrl(
        rawVideoUrl,
      );

    if (detected) {
      return createValidatedVideo(
        detected.provider,
        detected.videoId,
      );
    }
  }

  /*
   * 3. Tolérance supplémentaire :
   * certains anciens contenus peuvent avoir placé
   * l'URL complète dans videoId.
   */
  if (
    typeof rawVideoId === "string" &&
    rawVideoId.trim()
  ) {
    const detected =
      detectVideoFromUrl(
        rawVideoId,
      );

    if (detected) {
      return createValidatedVideo(
        detected.provider,
        detected.videoId,
      );
    }
  }

  return null;
}

/* ============================================================================
 * VIDEO RENDERER
 * ============================================================================
 */

function renderDescriptionVideo(
  node: PublicCourseDescriptionNode,
  context: RenderNodeContext,
  path: string,
): ReactNode {
  const video =
    validatePublicVideo(node);

  if (!video) {
    return null;
  }

  const title =
    getPublicCourseDescriptionVideoTitle(
      typeof node.attrs?.videoTitle ===
        "string"
        ? node.attrs.videoTitle
        : null,
      context.courseTitle,
    );

  const providerLabel =
    video.provider === "youtube"
      ? "YouTube"
      : "Vimeo";

  return (
    <figure
      key={path}
      className="my-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-lg sm:my-10 sm:rounded-3xl"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <iframe
          src={video.embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>

      <figcaption className="flex flex-col gap-2 border-t border-white/10 bg-slate-950 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-white sm:text-base">
            {title}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-400">
            Vidéo de démonstration ·{" "}
            {providerLabel}
          </p>
        </div>

        <a
          href={video.canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center text-xs font-extrabold text-blue-300 underline decoration-blue-500/60 underline-offset-4 transition-colors hover:text-white"
        >
          Ouvrir sur {providerLabel}
        </a>
      </figcaption>
    </figure>
  );
}

/* ============================================================================
 * NODE RENDERER
 * ============================================================================
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

    case "video":
      return renderDescriptionVideo(
        node,
        context,
        path,
      );

    default:
      return null;
  }
}

/* ============================================================================
 * RICH DESCRIPTION
 * ============================================================================
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

/* ============================================================================
 * FALLBACK DESCRIPTION
 * ============================================================================
 */

function renderFallbackDescription(
  description: string,
): ReactNode {
  const paragraphs = description
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

/* ============================================================================
 * PUBLIC COMPONENT
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
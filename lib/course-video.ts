export type CourseVideoProvider = "youtube" | "vimeo";
export type CourseVideo = {
  provider: CourseVideoProvider;
  videoId: string;
  videoUrl: string;
  embedUrl: string;
};

function fromId(provider: unknown, id: unknown): CourseVideo | null {
  if (typeof id !== "string") return null;
  const videoId = id.trim();
  if (provider === "youtube" && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return {
      provider,
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`,
    };
  }
  if (provider === "vimeo" && /^\d{5,15}$/.test(videoId)) {
    return {
      provider,
      videoId,
      videoUrl: `https://vimeo.com/${videoId}`,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
    };
  }
  return null;
}

/** Rebuild playback URLs from trusted providers; never embed arbitrary URLs or HTML. */
export function parseCourseVideoUrl(value: unknown): CourseVideo | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "youtu.be") return fromId("youtube", parts[0]);
  if (
    [
      "youtube.com",
      "m.youtube.com",
      "music.youtube.com",
      "youtube-nocookie.com",
    ].includes(host)
  ) {
    return fromId(
      "youtube",
      url.pathname === "/watch"
        ? url.searchParams.get("v")
        : ["embed", "shorts", "live"].includes(parts[0])
          ? parts[1]
          : null,
    );
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    return fromId(
      "vimeo",
      [...parts].reverse().find((part) => /^\d{5,15}$/.test(part)),
    );
  }
  return null;
}

export function normalizeCourseVideo(
  attrs: Record<string, unknown>,
): CourseVideo | null {
  return (
    fromId(attrs.provider, attrs.videoId) ??
    parseCourseVideoUrl(attrs.videoUrl) ??
    parseCourseVideoUrl(attrs.videoId)
  );
}

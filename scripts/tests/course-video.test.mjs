import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, extra = "", dependencies = {}) {
  const source =
    readFileSync(new URL(`../../${file}`, import.meta.url), "utf8") + extra;
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const result = { exports: {} };
  vm.runInNewContext(
    code,
    {
      module: result,
      exports: result.exports,
      URL,
      console,
      require: (name) =>
        Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    },
    { filename: file },
  );
  return result.exports;
}
const video = load("lib/course-video.ts");
const courseTypes = load("types/public-course.ts");
const publicCourses = load(
  "lib/public-courses.ts",
  "\nexport { normalizeDescriptionContent };",
  {
    "server-only": {},
    "@/lib/db": { db: {} },
    "@/lib/course-video": video,
    "@/types/public-course": courseTypes,
  },
);
const renderer = load(
  "components/public/formations/FormationDescriptionRenderer.tsx",
  "",
  { "@/types/public-course": courseTypes },
);
const editor = load(
  "components/admin/formations/FormationDescriptionEditor.tsx",
  "\nexport { VideoPreview, AfriSkillVideo };",
  { "@/lib/course-video": video },
);

const youtubeId = "M7lc1UVf-VE";
const youtube = {
  type: "video",
  attrs: {
    provider: "youtube",
    videoId: youtubeId,
    videoUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    videoTitle: "Démonstration",
  },
};
const vimeo = {
  type: "video",
  attrs: {
    provider: "vimeo",
    videoId: "76979871",
    videoUrl: "https://vimeo.com/76979871",
  },
};

test("preserve multiple saved videos and text in their original order", () => {
  const document = publicCourses.normalizeDescriptionContent({
    type: "doc",
    content: [
      youtube,
      {
        type: "paragraph",
        content: [{ type: "text", text: "Entre les vidéos" }],
      },
      vimeo,
    ],
  });
  assert.equal(document.content.length, 3);
  assert.equal(document.content[0].attrs.videoId, youtubeId);
  assert.equal(document.content[1].content[0].text, "Entre les vidéos");
  assert.equal(document.content[2].attrs.videoId, "76979871");
  const html = renderToStaticMarkup(
    React.createElement(renderer.default, {
      course: {
        title: "Formation",
        description: "",
        descriptionContent: document,
      },
    }),
  );
  assert.equal((html.match(/<iframe/g) || []).length, 2);
  assert.ok(html.includes(`youtube-nocookie.com/embed/${youtubeId}`));
  assert.ok(html.includes("player.vimeo.com/video/76979871"));
  assert.ok(html.indexOf(youtubeId) < html.indexOf("Entre les vidéos"));
  assert.ok(html.indexOf("Entre les vidéos") < html.indexOf("76979871"));
});

test("retain legacy descriptions containing only a video URL", () => {
  const doc = publicCourses.normalizeDescriptionContent({
    type: "doc",
    content: [
      { type: "video", attrs: { videoUrl: `https://youtu.be/${youtubeId}` } },
    ],
  });
  assert.equal(doc.content[0].attrs.provider, "youtube");
  assert.equal(doc.content[0].attrs.videoId, youtubeId);
});

test("reject arbitrary embed URLs and unsupported providers", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://youtube.com.evil.example/watch?v=M7lc1UVf-VE",
    "https://example.com/video",
    "http://youtu.be/M7lc1UVf-VE",
  ])
    assert.equal(video.parseCourseVideoUrl(url), null);
  assert.equal(
    video.normalizeCourseVideo({ provider: "youtube", videoId: "<script>" }),
    null,
  );
});

test("remove invalid video nodes without removing adjacent text", () => {
  const doc = publicCourses.normalizeDescriptionContent({
    type: "doc",
    content: [
      { type: "video", attrs: { videoUrl: "https://evil.example/embed" } },
      { type: "paragraph", content: [{ type: "text", text: "Conservé" }] },
    ],
  });
  assert.equal(doc.content.length, 1);
  assert.equal(doc.content[0].content[0].text, "Conservé");
});

test("editor preview contains a real player and an external playback fallback", () => {
  const html = renderToStaticMarkup(
    React.createElement(editor.VideoPreview, {
      url: `https://youtu.be/${youtubeId}`,
      title: "Aperçu",
    }),
  );
  assert.ok(html.includes("<iframe"));
  assert.ok(html.includes(`youtube-nocookie.com/embed/${youtubeId}`));
  assert.ok(html.includes('referrerPolicy="strict-origin-when-cross-origin"'));
  assert.ok(
    html.includes(`href="https://www.youtube.com/watch?v=${youtubeId}"`),
  );
  assert.equal(typeof editor.AfriSkillVideo.config.addNodeView, "function");
});

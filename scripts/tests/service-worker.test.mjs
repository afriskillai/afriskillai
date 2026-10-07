import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";

const code = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
function setup(cached = null) {
  const listeners = {};
  const state = { puts: [], deleted: [], fetches: [], claimed: false };
  const response = (type) => ({ ok: true, type: "basic", headers: { get: () => type }, clone() { return this; } });
  state.network = response("image/png");
  const cache = { match: async () => cached, put: async (...args) => state.puts.push(args) };
  vm.runInNewContext(code, {
    URL,
    self: { location: { origin: "https://site.example" }, addEventListener: (name, handler) => listeners[name] = handler,
      skipWaiting: async () => {}, clients: { claim: async () => state.claimed = true } },
    caches: { open: async () => cache, keys: async () => ["afriskill-ai-static-v1", "afriskill-ai-static-v2", "another-app"], delete: async name => state.deleted.push(name) },
    fetch: async request => { state.fetches.push(request); return state.network; },
  });
  const request = async pathname => {
    let pending;
    listeners.fetch({ request: { method: "GET", url: "https://site.example" + pathname }, respondWith: promise => pending = promise });
    return pending ? await pending : null;
  };
  return { state, listeners, response, request };
}

test("leave Next.js assets and sensitive routes to the browser", async () => {
  const { request, state } = setup();
  for (const pathname of ["/_next/static/css/site.css", "/_next/static/chunks/app.js", "/api/checkout", "/admin", "/panier", "/compte"]) {
    assert.equal(await request(pathname), null);
  }
  assert.equal(state.fetches.length, 0);
});

test("ignore a cached HTML response and replace it with the actual image", async () => {
  const invalid = { ok: true, type: "basic", headers: { get: () => "text/html" } };
  const { request, state } = setup(invalid);
  assert.equal(await request("/logo/logo.png"), state.network);
  assert.equal(state.fetches.length, 1);
  assert.equal(state.puts.length, 1);
});

test("never cache HTML returned for an image URL", async () => {
  const { request, state, response } = setup();
  state.network = response("text/html");
  await request("/logo/logo.png");
  assert.equal(state.puts.length, 0);
});

test("reuse a valid cached image", async () => {
  const image = { ok: true, type: "basic", headers: { get: () => "image/png" } };
  const { request, state } = setup(image);
  assert.equal(await request("/logo/logo.png"), image);
  assert.equal(state.fetches.length, 0);
});

test("remove previous AfriSkill caches without affecting other apps", async () => {
  const { listeners, state } = setup();
  let pending;
  listeners.activate({ waitUntil: promise => pending = promise });
  await pending;
  assert.deepEqual(state.deleted, ["afriskill-ai-static-v1"]);
  assert.equal(state.claimed, true);
});

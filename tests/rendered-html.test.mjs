import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Home Together product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>本周 · Home Together<\/title>/i);
  assert.match(html, /HOME TOGETHER/);
  assert.match(html, /这周，我们一起把家照顾好/);
  assert.match(html, /换床单/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships the installable PWA and Supabase security baseline", async () => {
  const [manifest, serviceWorker, schema, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/manifest.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(manifest, /display:\s*"standalone"/);
  assert.match(manifest, /icon-512\.png/);
  assert.match(serviceWorker, /CACHE_NAME/);
  assert.match(serviceWorker, /caches\.match/);
  assert.match(layout, /og\.png/);
  assert.match(packageJson, /@supabase\/supabase-js/);
  assert.match(schema, /enable row level security/);
  assert.match(schema, /create or replace function public\.complete_task/);
  assert.match(schema, /create or replace function public\.undo_task_completion/);
  await Promise.all([
    access(new URL("../public/icon-192.png", import.meta.url)),
    access(new URL("../public/icon-512.png", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);
});

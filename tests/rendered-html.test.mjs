import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("builds a GitHub Pages-ready Home Together application", async () => {
  const [html, assets] = await Promise.all([
    readFile(new URL("../gh-pages/index.html", import.meta.url), "utf8"),
    readdir(new URL("../gh-pages/assets/", import.meta.url)),
  ]);

  assert.match(html, /<title>本周 · Home Together<\/title>/i);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /apple-touch-icon\.png/);
  assert.ok(assets.some((name) => /^index-.*\.js$/.test(name)));
  assert.ok(assets.some((name) => /^index-.*\.css$/.test(name)));
  await access(new URL("../gh-pages/.nojekyll", import.meta.url));
});

test("ships a subpath-safe installable PWA and Supabase security baseline", async () => {
  const [manifestText, serviceWorker, schema, migration, app, tasks, workflow, pagesConfig, packageJson] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608160001_password_auth_single_household.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/HomeTogetherApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/tasks.ts", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8"),
    readFile(new URL("../vite.pages.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.match(serviceWorker, /self\.registration\.scope/);
  assert.doesNotMatch(serviceWorker, /caches\.match\("\/"\)/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(pagesConfig, /GITHUB_REPOSITORY/);
  assert.match(packageJson, /@supabase\/supabase-js/);
  assert.match(app, /signInWithPassword/);
  assert.match(app, /auth\.signUp/);
  assert.doesNotMatch(app, /signInWithOtp/);
  assert.match(schema, /enable row level security/);
  assert.match(schema, /household_members_one_household_per_profile/);
  assert.match(migration, /create unique index if not exists household_members_one_household_per_profile/);
  assert.match(migration, /每个账号只能属于一个家庭/);
  assert.match(tasks, /completion_records!completion_records_instance_id_fkey/);
  assert.match(schema, /create or replace function public\.complete_task/);
  assert.match(schema, /create or replace function public\.undo_task_completion/);
  await Promise.all([
    access(new URL("../public/icon-192.png", import.meta.url)),
    access(new URL("../public/icon-512.png", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);
});

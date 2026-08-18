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
  const [manifestText, serviceWorker, schema, householdMigration, inviteMigration, taskMutationMigration, oneOffTimingMigration, completionTimeMigration, app, styles, tasks, workflow, pagesConfig, packageJson] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608160001_password_auth_single_household.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608160002_fix_invite_code_generation.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608160003_task_edit_delete.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608170001_one_off_task_timing.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608180001_edit_completion_time.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/HomeTogetherApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
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
  assert.match(householdMigration, /create unique index if not exists household_members_one_household_per_profile/);
  assert.match(householdMigration, /每个账号只能属于一个家庭/);
  assert.match(inviteMigration, /pg_catalog\.gen_random_uuid/);
  assert.doesNotMatch(inviteMigration, /encode\(gen_random_bytes/);
  assert.match(tasks, /completion_records!completion_records_instance_id_fkey/);
  assert.match(app, /member\.id === currentUserId/);
  assert.doesNotMatch(app, /<option>Nicole<\/option><option>伴侣<\/option>/);
  assert.match(tasks, /table: "household_members"/);
  assert.match(tasks, /update_household_task/);
  assert.match(tasks, /delete_household_task/);
  assert.match(taskMutationMigration, /create or replace function public\.update_household_task/);
  assert.match(taskMutationMigration, /create or replace function public\.delete_household_task/);
  assert.match(schema, /one_off_timing in \('week', 'deadline'\)/);
  assert.match(oneOffTimingMigration, /add column if not exists one_off_timing/);
  assert.match(oneOffTimingMigration, /set one_off_timing = 'deadline'/);
  assert.match(oneOffTimingMigration, /一次性家务必须选择按周完成或截止日期/);
  assert.match(completionTimeMigration, /p_completed_at timestamptz/);
  assert.match(completionTimeMigration, /set completed_at = p_completed_at/);
  assert.match(completionTimeMigration, /next_scheduled_date/);
  assert.match(tasks, /one_off_timing/);
  assert.match(app, /今日截止提醒/);
  assert.match(app, /本周内完成/);
  assert.match(app, /这周还待完成的周期家务/);
  assert.match(app, /task\.type === "recurring" && task\.status === "pending"/);
  assert.match(app, /setWeekStartDate\(\(current\) => addDays\(current, -7\)\)/);
  assert.match(app, /setWeekStartDate\(\(current\) => addDays\(current, 7\)\)/);
  assert.match(app, /function changeMonth\(amount: number\)/);
  assert.match(app, /aria-label="上一月"/);
  assert.match(app, /aria-label="下一月"/);
  assert.match(app, /按周完成/);
  assert.match(app, /截止日期/);
  assert.match(app, /实际完成时间/);
  assert.match(app, /home-together-logo\.png/);
  assert.match(styles, /\.brand-mark img/);
  assert.match(tasks, /p_completed_at/);
  assert.match(app, /useOverlayScrollLock/);
  assert.match(styles, /overscroll-behavior: none/);
  assert.match(styles, /height: 100dvh/);
  assert.match(styles, /input\[type="datetime-local"\]/);
  assert.match(styles, /min-inline-size: 0/);
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /max-width: 100dvw/);
  assert.match(schema, /create or replace function public\.complete_task/);
  assert.match(schema, /create or replace function public\.undo_task_completion/);
  await Promise.all([
    access(new URL("../public/icon-192.png", import.meta.url)),
    access(new URL("../public/icon-512.png", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);
});

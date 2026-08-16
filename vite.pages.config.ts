import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";

const projectRoot = import.meta.dirname;

function normalizeBasePath(value: string) {
  if (!value || value === "/") return "/";
  return `/${value.replace(/^\/+|\/+$/g, "")}/`;
}

function githubPagesBase(repository: string | undefined) {
  const repositoryName = repository?.split("/").at(-1);
  if (!repositoryName || repositoryName.endsWith(".github.io")) return "/";
  return `/${repositoryName}/`;
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, projectRoot, "");
  const environment = { ...fileEnv, ...process.env };
  const base = normalizeBasePath(
    environment.PAGES_BASE_PATH || githubPagesBase(environment.GITHUB_REPOSITORY),
  );

  return {
    root: resolve(projectRoot, "pages"),
    base,
    publicDir: resolve(projectRoot, "public"),
    resolve: {
      alias: { "@": projectRoot },
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
      "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(
        environment.NEXT_PUBLIC_SUPABASE_URL || "",
      ),
      "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
      ),
      "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(
        environment.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      ),
    },
    plugins: [react()],
    build: {
      outDir: resolve(projectRoot, "gh-pages"),
      emptyOutDir: true,
    },
  };
});

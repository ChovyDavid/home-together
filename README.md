# Home Together

一个手机优先、可安装到主屏幕的家庭家事协作 PWA。首版覆盖本周执行、月历回顾、周期/一次性任务、完成备注、撤销完成、双人家庭邀请和实时同步。

## 本地启动

需要 Node.js `>=22.13.0`。

```bash
corepack enable
pnpm install
pnpm run dev
```

未配置 Supabase 时，应用自动进入可操作的演示模式，方便直接体验主要页面与交互。

## 连接 Supabase

1. 在 Supabase 新建项目。
2. 打开 SQL Editor，执行 `supabase/schema.sql`。
3. 复制 `.env.example` 为 `.env.local`，填入项目 URL 与 publishable key。
4. 在 Supabase Authentication 的 URL Configuration 中加入本地与生产站点 URL。
5. 重新启动应用；此时邮箱 Magic Link、家庭邀请码、实时同步和行级权限会启用。

浏览器端仅使用 publishable/anon key；不要把 service role key 放入任何 `NEXT_PUBLIC_` 环境变量。

## 数据与权限

- 所有业务表都带 `household_id`。
- Row Level Security 只允许家庭成员读取或修改同一家庭的数据。
- 完成记录通过失效标记支持撤销，不会被无痕覆盖。
- 周期任务完成后由数据库事务生成下一次实例。
- `task_instances` 和 `completion_records` 已加入 Supabase Realtime。

## 验证

```bash
pnpm run lint
pnpm run build
pnpm test
```

PWA 资源包括 Web App Manifest、Service Worker、192/512 图标、Apple Touch Icon 和社交分享卡片。

## 部署到自己的 GitHub Pages

仓库已包含 `.github/workflows/deploy-pages.yml`。推送到 `main` 后，GitHub Actions 会构建静态站点并发布到 GitHub Pages；普通项目仓库的 `/<repo>/` 子路径会被自动处理。

1. 在 GitHub 新建公开仓库，并把本项目推送到 `main`。
2. 打开仓库的 **Settings → Pages**，将 **Source** 设为 **GitHub Actions**。
3. 在 **Settings → Secrets and variables → Actions** 添加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. 在 Supabase Authentication 的 URL Configuration 中加入最终的 GitHub Pages 地址，例如 `https://<用户名>.github.io/<仓库名>/`。
5. 重新运行或等待 `Deploy Home Together to GitHub Pages` 工作流完成。

不配置 Supabase secrets 也能先发布，站点会以演示模式运行。

本地验证 Pages 版本：

```bash
pnpm run dev:pages
pnpm run build:pages
```

# Home Together

一个手机优先、可安装到主屏幕的家庭家事协作 PWA。首版覆盖本周执行、月历回顾、周期/一次性任务、完成备注、撤销完成、双人家庭邀请和实时同步。

## 本地启动

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
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
npm run lint
npm run build
npm test
```

PWA 资源包括 Web App Manifest、Service Worker、192/512 图标、Apple Touch Icon 和社交分享卡片。

# PROGRESS

## 项目流程记录

- R001 `aa038b50` 完成 agent 基础设施初始化，记录前端技术栈澄清，引入 `vendor/zembra-schema` 共享数据库契约 submodule，并固定到 `v0.1.0`。
- R002 `aa038b50` 完成数据库契约相关依赖约束初始化，记录前端允许、条件允许和默认禁止依赖，明确不引入 SQLite driver、ORM 或组件内 Supabase 直连。
- R003 `aa038b50` 初始化前端工程，建立 Vite、React、TypeScript、Tailwind CSS v4、TanStack Router、Zustand、Vitest 基础结构，补充 Docker 静态部署和 Vercel SPA rewrite，验证 `npm run test` 与 `npm run build` 通过。
- R004 `5509025c` 根据 `preview.html` 完成首页深色工作台改版，接入 `/fields` 展示真实 Fields，notes、Tags 和统计保持占位，实现底部 composer 格式插入，并修复 composer 与 note 流左边界和宽度对齐。

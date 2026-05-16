# PROGRESS

## 项目流程记录

- R001 `aa038b50` 完成 agent 基础设施初始化，记录前端技术栈澄清，引入 `vendor/zembra-schema` 共享数据库契约 submodule，并固定到 `v0.1.0`。
- R002 `aa038b50` 完成数据库契约相关依赖约束初始化，记录前端允许、条件允许和默认禁止依赖，明确不引入 SQLite driver、ORM 或组件内 Supabase 直连。
- R003 `aa038b50` 初始化前端工程，建立 Vite、React、TypeScript、Tailwind CSS v4、TanStack Router、Zustand、Vitest 基础结构，补充 Docker 静态部署和 Vercel SPA rewrite，验证 `npm run test` 与 `npm run build` 通过。
- R004 `9d1ca13` 根据 `preview.html` 完成首页深色工作台改版，接入 `/fields?all=true`、`/tags?all=true` 与 `POST /notes/recent` 展示真实数据，打通 composer 创建笔记，优化独立滚动、窄屏布局、展开逻辑、工具按钮、占位提示和 field 元信息展示。
- R005 `0229173a` 根据 `docs/exec-plans/active/home-ui/r005-light-theme-mode.md` 完成 Web UI 浅色默认主题，新增 light/dark token、主题 Provider、纯图标切换按钮和本地记忆，覆盖首页、同步设置页与 backend Toast，并通过测试、构建和浏览器验证。
- R007 `775c508` 根据 `docs/exec-plans/active/api-client/r007-backend-url-gate.md` 完成后端 URL 门禁、直连健康检查、关键日志、IP/Host 与 Port 默认输入、首页文案和按钮位置调整，并基于 OpenAPI 确认的删除接口补齐笔记删除功能。

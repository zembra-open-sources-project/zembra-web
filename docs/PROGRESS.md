# PROGRESS

## 项目流程记录

- R001 `aa038b50` 完成 agent 基础设施初始化，记录前端技术栈澄清，引入 `vendor/zembra-schema` 共享数据库契约 submodule，并固定到 `v0.1.0`。
- R002 `aa038b50` 完成数据库契约相关依赖约束初始化，记录前端允许、条件允许和默认禁止依赖，明确不引入 SQLite driver、ORM 或组件内 Supabase 直连。
- R003 `aa038b50` 初始化前端工程，建立 Vite、React、TypeScript、Tailwind CSS v4、TanStack Router、Zustand、Vitest 基础结构，补充 Docker 静态部署和 Vercel SPA rewrite，验证 `npm run test` 与 `npm run build` 通过。
- R004 `9d1ca13` 根据 `preview.html` 完成首页深色工作台改版，接入 `/fields?all=true`、`/tags?all=true` 与 `POST /notes/recent` 展示真实数据，打通 composer 创建笔记，优化独立滚动、窄屏布局、展开逻辑、工具按钮、占位提示和 field 元信息展示。
- R005 `0229173a` 根据 `docs/exec-plans/active/home-ui/r005-light-theme-mode.md` 完成 Web UI 浅色默认主题，新增 light/dark token、主题 Provider、纯图标切换按钮和本地记忆，覆盖首页、同步设置页与 backend Toast，并通过测试、构建和浏览器验证。
- R007 `775c508` 根据 `docs/exec-plans/active/api-client/r007-backend-url-gate.md` 完成后端 URL 门禁、直连健康检查、关键日志、IP/Host 与 Port 默认输入、首页文案和按钮位置调整，并基于 OpenAPI 确认的删除接口补齐笔记删除功能。
- R009 `a347f5e` 根据 `docs/exec-plans/active/home-ui/r009-edit-note.md` 完成首页 note card 原地编辑能力，复用 composer 输入 UI，提交时按正文重新解析 `#tag` 与第一个 `@field`，多个 field 通过 warning bubble 提示，并保持单 note 草稿锁定。
- R010 `9b0947b` 根据 `docs/exec-plans/active/home-ui/r010-daily-note-heatmap.md` 完成首页最近 30 天笔记热力图改造，接入后端每日统计接口，以每列 5 天的日历网格展示热力等级，并根据侧栏空间优化列宽、段落间距和日期格高度。
- R011 `3b8fdba` 完成首页视觉可读性修复，收紧顶部、侧栏、卡片列表和 note card 内部间距，将 composer 底部渐变限制在右侧内容列，并在展示态移除已渲染 tag 对应的正文标记，保留编辑态原始内容不变；同时补充前端测试禁止绑定静态视觉实现细节的规范。
- R012 `3ea1de1` 完成首页组件边界治理，将 note card、note editor、sidebar 与 heatmap 拆为独立组件，并把过滤、计数、解析和格式化逻辑迁移到 `homeUtils.ts`；同时将页面文件模块化要求沉淀到 `AGENTS.md`，明确页面只负责编排，复杂控件和纯工具函数必须独立维护。
- R015 `82748da` 完成 zembra-schema v0.4 二级 tag 的 Web UI 适配：前端保留 `TagRecord.path` 作为 note tag、筛选和 chip 展示标识，支持 `#root/child` 输入解析、父 tag 子树筛选、child tag 精确筛选，以及 sidebar 二级折叠树。验收后将 chip 显示统一为原始路径 `#root/child`，并修正树行箭头占位、子级缩进和旧叶子名兼容筛选问题。

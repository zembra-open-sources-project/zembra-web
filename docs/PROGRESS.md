# PROGRESS

## 项目流程记录

- R001 `aa038b50` 完成 agent 基础设施初始化，记录前端技术栈澄清，引入 `vendor/zembra-schema` 共享数据库契约 submodule，并固定到 `v0.1.0`。`4ded053` 根据当前 OpenAPI 将 HTTP 模式 note CRUD、recent、daily-counts 和 note tags 请求统一增加 `workspace_id` scope，默认优先读取 `VITE_ZEMBRA_WORKSPACE_ID`，未配置时从 `/workspaces` 取第一项并缓存，不保留旧接口兼容逻辑。
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
- R016 `535ab42` 根据 `docs/exec-plans/active/home-ui/r016-create-note-field-priority.md` 修复首页创建 note 的 field 解析优先级：创建提交先读取正文第一个 `@field`，没有 inline field 时才回退到当前选中 field，最后使用 `inbox`，并补充通用测试避免绑定截图内容或固定 field 名称。
- R017 `bb7e229` 根据 `docs/exec-plans/active/home-ui/r017-note-card-markdown-rendering.md` 完成 NoteCard 展示态 GFM Markdown 渲染，采用成熟 renderer 保留 `[[note_ref]]` 双链预览、外链新窗口、HTML 转义、行内代码样式和 tag/field 去重，并恢复 Markdown 列表 marker。
- R018 `41caa62` 根据 `docs/exec-plans/completed/home-ui/r018-login-workspace-selector.md` 完成登录入口 workspace 选择流程：复用现有 API 基础设施加载 `GET /workspaces`，持久化选中 workspace id，默认选择笔记最多 workspace，并将 note 请求 scope 改为环境变量或本地选择来源。
- R019 `4965261` 完成首页 note card field 快速切换：将卡片头部 `@field` 改为当前 note 专属切换入口，点击后以覆盖正文的浮层展示 field 列表，选择后复用 note 更新接口只迁移当前 note 的 field，不改变 sidebar 筛选、搜索或其它全局导航状态，并补充行为测试覆盖。
- R020 `62f3141` 调整首页 note editor 文本框高度行为：输入区随草稿内容自动增高，最多展示 5 行文本，超过后在文本框内部滚动，保持外层编辑器、工具栏和提交按钮布局职责不变，并通过测试与构建验证。
- R021 `74e32cf` 调整首页消息流时间语义：note card 头部时间改为展示创建时间，消息流渲染前按 `createdAt` 倒序排序，避免编辑或切换 field 后因为 `updatedAt` 变化打乱时间线，并补充创建时间展示与排序行为测试。
- R022 `24e35b6` 调整登录页 workspace 下拉展示格式：未命名 workspace 优先使用后端 `short_hash`，并将笔记数量显示为 `<note-hash>(note count: <count>)`，避免 hash 和数量混在一起，同时补充选项文案测试并通过测试与构建验证。

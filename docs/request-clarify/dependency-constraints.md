# 数据库契约相关依赖约束澄清

## 需求

根据项目群共享数据库契约，为本前端代码仓添加必要的依赖约束初始化动作。
本需求只记录需求澄清结果，不产出设计文档和开发计划。

## 已确认背景

- 共享数据表契约来自 `vendor/zembra-schema` submodule。
- 当前 schema 版本为 `v0.1.0`，commit 为 `a557f37c2827eb5cd8cd2ca4dd639a082764a763`。
- schema 当前覆盖 notes、fields、tags、note_tags、note_links、attachments、note_revisions 和 devices。
- 本仓库定位为前端 WebUI，不直接维护 SQLite DDL、migration 或 JSON Schema 正文。
- 前端第一阶段按轻量 SPA 方向初始化，后端数据库从 SQLite 起步，后续可能接入 Supabase。

## 初始化动作

本次初始化采用文档约束方式完成，不直接安装 npm 依赖。

原因：

- 当前仓库还没有前端工程文件和 `package.json`。
- 数据库约束首先影响依赖边界，而不是立即要求引入运行时包。
- 直接安装数据库相关依赖会提前绑定实现，和前端轻量部署目标冲突。

已初始化的约束入口：

| 文件 | 作用 |
| --- | --- |
| `docs/references/dependency-constraints.md` | 记录前端依赖允许项、禁止项和延后项。 |
| `docs/FRONTEND.md` | 补充前端依赖边界约束。 |
| `AGENTS.md` | 补充后续添加依赖时必须遵守的规则。 |
| `docs/PROGRESS.md` | 记录本次初始化进展。 |

## 依赖约束结论

### 默认允许

前端工程初始化时，默认允许以下轻量依赖方向：

| 类型 | 依赖方向 | 用途 |
| --- | --- | --- |
| 构建 | Vite、TypeScript | 前端构建和类型检查。 |
| UI | React、React DOM | 卡片笔记界面和交互。 |
| 样式 | Tailwind CSS | 轻量样式系统。 |
| 路由 | TanStack Router | 类型安全路由和 URL 查询状态。 |
| 状态 | Zustand | UI 状态、筛选状态和草稿状态。 |
| 图标 | lucide-react | 工具按钮图标。 |
| 测试 | Vitest、Testing Library | 单元测试和组件测试。 |

### 条件允许

以下依赖只能在有明确需求时引入：

| 类型 | 依赖方向 | 条件 |
| --- | --- | --- |
| 本地缓存 | Dexie.js | 仅用于 demo 数据、离线草稿或浏览器缓存。 |
| E2E | Playwright | 仅用于核心流程自动化验证。 |
| Supabase | Supabase JS SDK | 仅在认证、实时订阅或明确的 Supabase 直连场景中局部引入。 |
| 富文本 | Tiptap 或同类编辑器 | 仅在富文本需求确认后引入。 |

### 默认禁止

前端 WebUI 仓库默认禁止引入以下依赖：

| 类型 | 禁止原因 |
| --- | --- |
| SQLite driver，例如 `better-sqlite3`、`sqlite3`、`sql.js` | WebUI 不直接操作 SQLite，避免把数据库运行时打进前端或 Docker 静态镜像。 |
| ORM，例如 Prisma、Drizzle、TypeORM | 数据库访问属于服务端或数据访问实现层，不属于前端 UI 层职责。 |
| 在组件中直接使用 Supabase 查询 | 会让 UI 组件绑定未来后端提供方，削弱 SQLite 到 Supabase 的迁移边界。 |
| 大型 UI 套件，例如 Ant Design、Material UI | 与轻量卡片笔记 UI 和轻量 demo 目标不匹配。 |
| 首阶段完整富文本编辑器 | 会提前放大包体、输入复杂度和数据模型复杂度。 |

## 数据契约消费规则

- `vendor/zembra-schema` 是唯一数据库契约来源。
- 前端代码不得复制维护 SQLite DDL、migration 或 JSON Schema 正文。
- 前端可以基于业务语义定义 DTO 和 ViewModel，但字段含义必须能回溯到共享 schema。
- UI 组件只依赖 API Client、Repository 或 feature 层暴露的业务方法。
- 任何新增依赖如果会触达数据库、schema、同步或持久化能力，必须先更新本约束文档或对应需求澄清文档。

## 结论

本仓库的依赖初始化以约束文档为主，不在当前阶段安装数据库相关运行时依赖。
后续创建前端工程时，应按轻量 SPA 技术栈添加依赖，并保持数据库访问隔离在 API Client 或 Repository 层之后。

# 依赖约束

## 目标

本文件记录前端 WebUI 仓库的依赖边界，重点约束数据库契约相关依赖。

## 数据库契约边界

- 共享数据库契约来自 `vendor/zembra-schema`。
- 本仓库不复制维护 SQLite DDL、migration 或 JSON Schema 正文。
- 前端 UI 不直接读取、写入或迁移 SQLite。
- 前端 UI 不直接绑定 Supabase 查询实现。
- 数据访问必须经过 API Client、Repository 或 feature 层。

## 默认允许依赖

| 类型 | 依赖方向 |
| --- | --- |
| 构建 | Vite、TypeScript |
| UI | React、React DOM |
| 样式 | Tailwind CSS |
| 路由 | TanStack Router |
| 状态管理 | Zustand |
| 图标 | lucide-react |
| 测试 | Vitest、Testing Library |

## 条件允许依赖

| 类型 | 依赖方向 | 条件 |
| --- | --- | --- |
| 本地缓存 | Dexie.js | 仅用于本地 demo、离线草稿或浏览器缓存。 |
| E2E 测试 | Playwright | 仅用于核心流程自动化验证。 |
| Supabase SDK | `@supabase/supabase-js` | 仅在认证、实时订阅或明确直连场景中局部使用。 |
| 富文本编辑器 | Tiptap 或同类库 | 仅在富文本需求确认后引入。 |

## 默认禁止依赖

| 类型 | 示例 | 原因 |
| --- | --- | --- |
| SQLite driver | `better-sqlite3`、`sqlite3`、`sql.js` | WebUI 不直接操作 SQLite。 |
| ORM | Prisma、Drizzle、TypeORM | 数据库访问不属于前端 UI 层职责。 |
| 重型 UI 套件 | Ant Design、Material UI | 不符合轻量卡片笔记 UI 目标。 |
| 组件内 Supabase 查询 | 直接在 React 组件中调用 Supabase 查询 | 会破坏 API Client 和 Repository 边界。 |

## 新增依赖检查

新增依赖前需要确认：

- 是否会进入生产包体。
- 是否会让 UI 层感知 SQLite、Supabase 或 schema 文件细节。
- 是否能通过 API Client、Repository 或 feature 层隔离。
- 是否和 Docker 静态部署、Vercel 轻量 demo 目标冲突。
- 是否已有更轻的原生能力或现有依赖可满足需求。

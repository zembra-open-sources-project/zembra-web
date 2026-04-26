# 前端技术栈选型澄清

## 需求

本项目是一个卡片式笔记应用的 Web UI，目标体验参考 flomo。
项目计划通过 Docker 分发部署，并在 Vercel 等托管平台提供一个轻量 demo。
前端技术栈需要保持轻量，避免引入重型依赖。

## 已确认背景

- 产品形态是以卡片笔记为核心的笔记 Web UI。
- 应用需要支持 Docker 方式部署。
- 应用需要能在 Vercel 或类似平台提供轻量 demo。
- 后端数据库第一阶段使用 SQLite。
- 后续可能接入 Supabase。
- 本需求只记录澄清结果，不需要继续产出设计文档和开发计划。

## 前端技术栈选型

| 模块 | 选型 | 原因 |
| --- | --- | --- |
| 构建工具 | Vite | 开发启动快，静态构建简单，适合 Docker 和 Vercel 部署。 |
| UI 框架 | React 19 | 生态成熟，适合笔记编辑、列表浏览、筛选和快捷键等交互。 |
| 开发语言 | TypeScript | 能为笔记、标签、筛选条件、同步状态和 API 响应提供稳定类型约束。 |
| 样式方案 | Tailwind CSS v4 | 配置轻，构建快，适合快速搭建统一的卡片式界面。 |
| 路由 | TanStack Router | 类型安全，对 URL search params 支持好，适合承载标签、搜索和排序状态。 |
| 状态管理 | Zustand | API 小，足够承载 UI 状态、草稿、筛选条件和本地交互状态。 |
| API 层 | 原生 fetch 小型封装 | 降低依赖数量，避免 UI 代码绑定到具体后端提供方。 |
| 本地持久化 | Dexie.js 作为可选缓存 | 可用于本地 demo 数据、离线草稿和浏览器缓存，但不作为主数据库抽象。 |
| 图标 | lucide-react | 依赖轻，风格干净，适合笔记应用中的工具按钮。 |
| 单元测试 | Vitest + Testing Library | 与 Vite 直接适配，前端测试运行快。 |
| E2E 测试 | Playwright 作为可选覆盖 | 适合验证新建、编辑、搜索和标签筛选等核心流程。 |

## 数据层决策

后端从 SQLite 起步，后续可能迁移到 Supabase，这不会改变前端主技术栈选型。

主要调整是：Dexie.js 不作为核心数据层，只作为本地 demo、离线草稿或浏览器缓存的可选模块。

应用数据访问需要通过一个小型 API Client 或 Repository 层隔离：

```text
src/
  api/
    notes.client.ts
    tags.client.ts
    types.ts
  features/
    notes/
    tags/
  stores/
  db/
    draft-cache.ts
```

UI 层只依赖业务方法，例如：

```ts
export interface NotesClient {
  listNotes(query: NotesQuery): Promise<Note[]>
  createNote(input: CreateNoteInput): Promise<Note>
  updateNote(id: string, input: UpdateNoteInput): Promise<Note>
  deleteNote(id: string): Promise<void>
}
```

SQLite 阶段，这些方法调用后端 API。
Supabase 阶段，可以继续通过后端 API 代理，也可以只在认证、实时更新或直接数据访问等局部场景接入 Supabase。

## 部署方向

- 第一阶段前端保持静态 SPA。
- 使用 `npm run build` 构建，产物输出到 `dist/`。
- Docker 使用多阶段构建：Node 负责构建，nginx 或 Caddy 负责托管静态文件。
- Vercel 可以直接部署 Vite 应用。
- Vercel 上的 SPA 深链需要 rewrite 到 `index.html`。
- 轻量 demo 可以使用 mock 数据或 Dexie 本地持久化，不强依赖后端。

## 排除方案

| 方案 | 原因 |
| --- | --- |
| Next.js | 对当前前端卡片笔记 UI 目标偏重，暂时不需要 SSR 和全栈框架能力。 |
| Redux Toolkit | 对当前交互状态来说样板代码偏多。 |
| Material UI / Ant Design | 依赖偏重，视觉风格更接近后台系统，不适合轻量 flomo 风格笔记应用。 |
| 第一阶段引入完整富文本编辑器 | 会在富文本需求明确前提前增加包体、数据模型和输入交互复杂度。 |
| 在组件中直接铺开 Supabase 调用 | 会让 UI 组件提前绑定未来后端提供方，也会降低 SQLite 阶段的架构清晰度。 |

## 结论

前端基础栈使用 `Vite + React + TypeScript + Tailwind CSS v4`。
数据访问通过 API Client 或 Repository 层隔离。
Dexie.js 只作为可选本地缓存或 demo 持久化方案。
这个方案能保持 Docker 和 Vercel 部署轻量，同时保留从 SQLite 迁移到 Supabase 的清晰路径。

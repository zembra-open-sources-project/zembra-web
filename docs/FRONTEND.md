# FRONTEND

## 数据访问约束

- 前端主技术栈使用 `Vite + React + TypeScript + Tailwind CSS v4`。
- 前端数据访问通过 API Client 或 Repository 层隔离。
- UI 组件不得直接依赖 SQLite 表结构、migration 文件或 Supabase 查询实现。
- `vendor/zembra-schema` 只作为共享数据表契约来源，前端类型和 API DTO 需要围绕业务语义建立。
- Dexie.js 仅作为本地 demo、离线草稿或浏览器缓存的可选模块，不作为主数据库抽象。

## 依赖约束

- 前端仓库默认不引入 SQLite driver、ORM 或数据库 migration 运行时依赖。
- Supabase SDK 只在认证、实时订阅或明确直连场景中局部引入，不能在 UI 组件中直接铺开查询。
- 数据库、schema、同步和持久化相关依赖新增前，必须先核对 `docs/references/dependency-constraints.md`。
- Docker 和 Vercel demo 路径下的生产依赖需要保持轻量，避免引入大型 UI 套件和首阶段不必要的富文本编辑器。

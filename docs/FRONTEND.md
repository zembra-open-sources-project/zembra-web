# FRONTEND

## 数据访问约束

- 前端主技术栈使用 `Vite + React + TypeScript + Tailwind CSS v4`。
- 前端数据访问通过 API Client 或 Repository 层隔离。
- UI 组件不得直接依赖 SQLite 表结构、migration 文件或 Supabase 查询实现。
- `vendor/zembra-schema` 只作为共享数据表契约来源，前端类型和 API DTO 需要围绕业务语义建立。
- Dexie.js 仅作为本地 demo、离线草稿或浏览器缓存的可选模块，不作为主数据库抽象。

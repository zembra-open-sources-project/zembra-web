# r014-supabase-secret-key-api 需求澄清

日期：2026-05-28

## 背景

后端更新了 Supabase API 接入方式，前端需要访问实时 OpenAPI，并按最新契约改造同步配置相关接口。

## 已确认契约

| 项目 | 结论 |
| --- | --- |
| OpenAPI 地址 | `http://127.0.0.1:3000/api-docs/openapi.json` |
| 同步配置读取 | `GET /sync/config` |
| 同步配置保存 | `PUT /sync/config` |
| 配置测试 | `POST /sync/config/test` |
| 手动同步 | `POST /sync/run` |
| 状态读取 | `GET /sync/status` |
| Secret 请求字段 | `secret_key` |
| Secret 状态字段 | `secret_key_configured` |

## 范围

- 更新前端 sync API 类型、请求体构造和响应映射。
- 更新 sync client 单元测试，确保请求体使用最新后端字段。
- 保持 UI 组件不直接依赖 Supabase SDK 或数据库结构。

## 不做范围

- 不新增前端 Supabase SDK。
- 不改造后端服务。
- 不调整同步页面布局和交互流程。

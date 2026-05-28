# r004-supabase-config-page 需求澄清

日期：2026-05-14

## 需求结论

本次为 WebUI 新增 Supabase 同步配置页。页面入口放在首页左侧栏顶部的 Settings 入口，点击后进入独立配置页面。配置页通过后端 `/sync/*` API 读取、测试、保存 Supabase 同步配置，并提供手动同步能力。

## API 发现

| 项目 | 结论 |
| --- | --- |
| OpenAPI 地址 | `http://127.0.0.1:3000/api-docs/openapi.json` |
| 读取配置 | `GET /sync/config`，返回安全展示用配置，不暴露 `secret_key` |
| 保存配置 | `PUT /sync/config`，保存 `enabled`、`interval_seconds`、`supabase_url` 和可选 `secret_key` |
| 测试配置 | `POST /sync/config/test`，测试候选配置，不持久化 |
| 查询状态 | `GET /sync/status`，返回同步启用状态和 cursor rows |
| 手动同步 | `POST /sync/run`，执行一次 push 和 pull 同步周期 |
| 单向同步 | `POST /sync/push`、`POST /sync/pull`，后续设计时按界面风险决定是否暴露为独立操作 |

## 范围

| 项目 | 结论 |
| --- | --- |
| 页面入口 | 首页左侧栏顶部新增 Settings 入口。 |
| 页面形态 | 点击 Settings 后进入独立页面，推荐路由为 `/settings/sync`。 |
| 配置字段 | `enabled`、`supabase_url`、`interval_seconds`、`secret_key`。 |
| Secret 展示 | 只展示 `secret_key_configured` 的已配置/未配置状态；输入框只用于设置新 key。 |
| Secret 保存 | `secret_key` 留空保存时不覆盖已有 key；填写时提交新 key。 |
| 间隔校验 | `interval_seconds` 允许 `0` 和正整数；前端只做整数校验，不重新定义 `0` 的后端语义。 |
| 手动同步 | 配置页包含手动同步能力，优先提供 `Run Sync`。 |
| 数据访问 | 前端通过 API Client 访问后端，不直接引入 Supabase SDK。 |

## 暂不处理

- 不让 React UI 组件直接调用 Supabase 查询。
- 不新增 SQLite driver、ORM 或数据库 migration 运行时依赖。
- 不在前端存储或回显 `secret_key` 明文。
- 不实现 UI 自动化测试，除非后续用户明确要求。

## 验收标准

- 首页左侧栏顶部可以进入 Supabase 同步配置独立页面。
- 配置页能读取并展示当前配置和同步状态。
- 用户可以测试候选 Supabase 配置，测试不会保存配置。
- 用户可以保存同步开关、Supabase URL、同步间隔和可选的新 service role key。
- 保存时 key 留空不会清除或覆盖后端已有 key。
- 用户可以从配置页触发一次手动同步，并看到成功或失败反馈。

# r004-supabase-config-page 设计文档

日期：2026-05-14

需求澄清文档：`docs/request-clarify/sync/r004-supabase-config-page.md`

## 核心功能（WHAT）

新增 Supabase 同步配置独立页面。用户从首页左侧栏顶部的 Settings 入口进入 `/settings/sync`，在页面内读取当前同步配置、编辑 Supabase URL、同步间隔、同步开关和可选的新 service role key，并可测试配置、保存配置、查看同步状态、触发一次手动同步。

### 需求背景（WHY）

后端已经提供 `/sync/*` API，WebUI 需要提供一个安全的配置入口，让用户不用直接改后端配置文件即可管理 Supabase 同步能力。前端必须继续保持 API Client 边界，不直接引入 Supabase SDK，也不暴露 `service_role_key` 明文。

### 需求目标（GOAL）

| 目标 | 设计结论 |
| --- | --- |
| 配置入口 | 首页左侧栏顶部新增 Settings 入口，跳转到 `/settings/sync`。 |
| 配置读取 | 进入页面后调用 `GET /sync/config` 和 `GET /sync/status`。 |
| 配置测试 | 点击 Test 调用 `POST /sync/config/test`，只测试候选值，不保存。 |
| 配置保存 | 点击 Save 调用 `PUT /sync/config`，保存表单值。 |
| Secret 处理 | 只展示 `service_role_key_configured`；输入框只用于设置新 key，留空不覆盖。 |
| 手动同步 | 点击 Run Sync 调用 `POST /sync/run`，展示 pushed/pulled 结果或错误。 |

### 范围边界

| In Scope | Out of Scope |
| --- | --- |
| 新增 sync API 类型和 client | 不引入 `@supabase/supabase-js` |
| 新增 `/settings/sync` 路由和页面 | 不做 Supabase 直连查询 |
| 首页左侧栏 Settings 入口 | 不新增 SQLite、ORM、migration 依赖 |
| 表单校验和请求状态反馈 | 不回显或缓存 service role key 明文 |
| 单元测试覆盖 client 和核心 UI 状态 | 不做 UI 自动化测试 |

## 实现流程（HOW）

### API Client

| 文件 | 职责 |
| --- | --- |
| `src/api/types.ts` | 增加 sync 配置、状态、测试和手动同步 DTO。 |
| `src/api/sync.client.ts` | 封装 `/sync/config`、`/sync/config/test`、`/sync/status`、`/sync/run`。 |
| `src/api/client.ts` | 暴露默认 `syncClient`，测试模式使用 mock client。 |

### API 类型

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `SyncConfigDto` | `enabled`、`intervalSeconds`、`supabaseUrl`、`serviceRoleKeyConfigured` | 前端展示用配置。 |
| `UpdateSyncConfigInput` | `enabled`、`intervalSeconds`、`supabaseUrl`、`serviceRoleKey?` | 保存配置时提交。 |
| `TestSyncConfigInput` | `supabaseUrl?`、`serviceRoleKey?` | 测试候选配置时提交。 |
| `SyncConfigTestResultDto` | `ok`、`message` | 展示连接测试结果。 |
| `SyncStatusDto` | `enabled`、`states` | 展示同步状态和 cursor。 |
| `SyncRunResultDto` | `pushed`、`pulled` | 展示手动同步结果。 |

后端字段使用 `snake_case`，client 映射为前端 `camelCase`。`service_role_key` 保存时仅在用户填写新 key 后加入请求体；空字符串会被 client 转为 `null` 或省略，避免覆盖已有 key。

### 页面结构

| 区域 | 内容 |
| --- | --- |
| 顶部 | 页面标题、返回首页入口、当前同步启用状态。 |
| 配置表单 | Enabled toggle、Supabase URL 输入框、Interval seconds 数字输入、Service role key 密码输入框。 |
| Secret 状态 | 显示“已配置”或“未配置”，不显示明文。 |
| 操作区 | Test Connection、Save Settings、Run Sync 三个动作按钮。 |
| 状态区 | 展示 `GET /sync/status` 的 cursor rows、最近成功/失败时间和错误消息。 |
| 反馈区 | 每个异步动作显示 loading、成功消息或 `ApiError` 消息。 |

### 路由与导航

`src/app/App.tsx` 新增 `/settings/sync` route，component 指向 `SyncSettingsPage`。首页左侧栏顶部使用 TanStack Router 的 `Link` 渲染 Settings 入口，视觉上放在品牌区下方、统计区上方。

### 状态归属

配置页使用局部 React state 管理表单草稿、加载状态、保存状态、测试结果、同步结果和错误消息。当前配置和状态只在页面加载与操作完成后刷新，不引入全局 store，避免把设置页状态扩散到笔记主流程。

### 校验策略

| 字段 | 校验 |
| --- | --- |
| `supabaseUrl` | 非空字符串；URL 格式由后端继续做最终校验。 |
| `intervalSeconds` | 必须是 `0` 或正整数。 |
| `serviceRoleKey` | 可空；非空时按原文提交，不在前端解析。 |

### 错误处理

| 场景 | 处理 |
| --- | --- |
| 网络失败 | 复用全局 backend 连接失败 toast。 |
| 后端 4xx/5xx | 页面展示 `ApiError.message`。 |
| 表单校验失败 | 禁止提交，并在字段附近显示简短错误。 |
| Run Sync 返回 503 | 展示同步未启用或后端返回的错误消息。 |

## 测试用例

### 编译检查

| 用例 | 预期 |
| --- | --- |
| `npm run build` | TypeScript 和 Vite 构建通过。 |

### 单元测试

| 用例 | 预期 |
| --- | --- |
| sync client 读取配置 | `GET /sync/config` 响应映射为 `SyncConfigDto`。 |
| sync client 保存配置 | 请求体使用后端 `snake_case` 字段，空 key 不覆盖已有 key。 |
| sync client 测试配置 | `POST /sync/config/test` 返回 `ok/message`。 |
| sync client 手动同步 | `POST /sync/run` 返回 pushed/pulled。 |
| 设置页加载 | 页面显示配置、状态和 key 配置状态。 |
| 设置页保存 | 有效表单会调用保存 API，并刷新页面配置。 |
| 设置页校验 | 非整数 interval 不会提交。 |

### 手工检查

| 用例 | 预期 |
| --- | --- |
| 从首页点击 Settings | 进入 `/settings/sync`。 |
| 留空 key 保存 | 已配置 key 不被前端明文覆盖。 |
| 点击 Test Connection | 页面展示测试成功或失败消息。 |
| 点击 Run Sync | 页面展示 pushed/pulled 结果或同步错误。 |

### 回归检查

| 用例 | 预期 |
| --- | --- |
| 首页笔记加载和创建 | 不受设置页新增 route 影响。 |
| backend 连接失败 toast | sync API 网络失败时仍触发全局 toast。 |

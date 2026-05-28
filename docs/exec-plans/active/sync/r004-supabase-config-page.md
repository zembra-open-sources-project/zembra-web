# r004-supabase-config-page 执行计划

日期：2026-05-14

需求澄清文档：`docs/request-clarify/sync/r004-supabase-config-page.md`
设计文档：`docs/design-docs/sync/r004-supabase-config-page.md`

## Stage 1：Sync API Client

### Task 1.1：补齐 sync 类型

**Status:** Finished

**Files:** Modify `src/api/types.ts`

**Function:** 定义 Supabase 同步配置、状态、测试结果和手动同步结果的前端 DTO、后端响应类型与输入类型。

**Implementation Notes:** 后端响应字段保持 `snake_case` 类型定义，前端 DTO 使用 `camelCase`。`secret_key` 只出现在保存和测试输入中，不出现在读取配置 DTO 中。

**Expected Verification Result:** TypeScript 能识别 sync client 所需全部类型，UI 层不需要直接引用后端 `snake_case` 字段。

### Task 1.2：实现 sync HTTP client

**Status:** Finished

**Files:** Create `src/api/sync.client.ts`; Modify `src/api/client.ts`; Create `src/api/sync.client.test.ts`

**Function:** 封装 `GET /sync/config`、`PUT /sync/config`、`POST /sync/config/test`、`GET /sync/status`、`POST /sync/run`。

**Implementation Notes:** 复用 `requestJson` 和默认 API base URL。保存配置时将空白 `serviceRoleKey` 转为不覆盖已有 key 的请求表达；所有响应映射为前端 DTO。测试模式提供 mock client，避免单元测试依赖本地后端。

**Expected Verification Result:** sync client 单元测试覆盖读取、保存、测试连接、查询状态和手动同步；网络失败仍复用全局 backend toast。

## Stage 2：Sync Settings 页面

### Task 2.1：新增设置页路由和入口

**Status:** Finished

**Files:** Modify `src/app/App.tsx`; Modify `src/pages/home/HomePage.tsx`; Create `src/pages/settings/SyncSettingsPage.tsx`

**Function:** 新增 `/settings/sync` 独立页面，并在首页左侧栏顶部增加 Settings 入口。

**Implementation Notes:** 使用 TanStack Router 的 `Link` 跳转。Settings 入口放在品牌区下方、统计区上方。页面顶部提供返回首页入口，避免进入设置页后迷失。

**Expected Verification Result:** 首页点击 Settings 后进入 `/settings/sync`，返回入口能回到首页。

### Task 2.2：实现配置表单和状态展示

**Status:** Finished

**Files:** Modify `src/pages/settings/SyncSettingsPage.tsx`; Create `src/pages/settings/SyncSettingsPage.test.tsx`

**Function:** 页面加载配置和同步状态，渲染 enabled、supabase URL、interval seconds、service role key 输入、key 配置状态和 cursor 状态。

**Implementation Notes:** 页面使用局部 state 管理草稿、加载态、错误消息和操作结果。`intervalSeconds` 只允许 `0` 或正整数。`serviceRoleKey` 留空时保存不覆盖后端已有 key。

**Expected Verification Result:** 页面测试覆盖加载配置、展示 key 配置状态、interval 校验和保存行为。

### Task 2.3：实现测试连接和手动同步

**Status:** Finished

**Files:** Modify `src/pages/settings/SyncSettingsPage.tsx`; Modify `src/pages/settings/SyncSettingsPage.test.tsx`

**Function:** 接入 Test Connection 和 Run Sync 操作，展示成功、失败、loading 和后端错误消息。

**Implementation Notes:** Test Connection 使用当前表单候选值，不触发保存。Run Sync 调用 `POST /sync/run`，成功后展示 pushed/pulled 并刷新 `GET /sync/status`。按钮在请求中禁用，避免重复提交。

**Expected Verification Result:** 页面测试覆盖测试连接、手动同步结果展示和错误消息展示。

## Stage 3：验证与计划回写

### Task 3.1：执行自动化验证

**Status:** Finished

**Files:** Verify `src/api/*`, `src/pages/*`, `src/app/*`

**Function:** 运行项目测试和构建，确认新增配置页没有破坏现有首页和 API client。

**Implementation Notes:** 运行 `npm test` 和 `npm run build`。如果测试环境发现布局或类型问题，先修复后重新验证。

**Expected Verification Result:** `npm test` 和 `npm run build` 均通过。

### Task 3.2：更新开发记录并提交 Stage

**Status:** Finished

**Files:** Modify `docs/exec-plans/active/sync/r004-supabase-config-page.md`; Git commit

**Function:** 根据实际实现结果更新任务状态和开发记录，并按项目规则完成原子提交。

**Implementation Notes:** commit message 必须符合 Conventional Commits，例如 `feat: add supabase sync settings page`。提交前确认 message 满足类型白名单、描述长度和具体技术细节要求。

**Expected Verification Result:** 执行计划记录实现和验证结果；完成一次有效 git commit。

## 开发记录

- 2026-05-14：已完成需求澄清、设计文档和执行计划；尚未进入代码实现。
- 2026-05-14：已完成 Stage 1，新增 sync API 类型、HTTP client、默认 client 入口和 client 单元测试。
- 2026-05-14：已完成 Stage 2，新增 `/settings/sync` 路由、首页 Settings 入口、Supabase 同步配置页和页面单元测试。
- 2026-05-14：已完成 Stage 3，`npm test` 通过 6 个测试文件共 27 个测试，`npm run build` 通过。尝试使用 Playwright 做浏览器验证时当前 Node 环境缺少 `playwright` 模块，浏览器自动化检查未执行。

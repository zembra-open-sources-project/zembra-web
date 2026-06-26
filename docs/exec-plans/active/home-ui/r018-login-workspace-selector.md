# r018-login-workspace-selector 开发计划

## 关联设计文档

- 需求澄清文档：`docs/request-clarify/home-ui/r018-login-workspace-selector.md`
- 设计文档：`docs/design-docs/home-ui/r018-login-workspace-selector.md`

## Stage #1: Workspace API 与本地配置边界

### 任务 #1: 增加 workspace 本地配置 helper

**Status:** Finished

**Files:** Modify `src/api/backendConfig.ts`, Modify/Create `src/api/backendConfig.test.ts`

**功能:** 为选中的 workspace id 提供统一的读取、保存、清空和解析入口。

**实现说明:** 增加 `workspaceIdStorageKey`、`getConfiguredWorkspaceId()`、`setConfiguredWorkspaceId()`、`clearConfiguredWorkspaceId()`。只保存 `workspace_id`，不保存 workspace name、note count 或 workspace 列表快照。函数需要有文档字符串，测试覆盖空值、trim、保存和清空。

**预期验证结果:** `npm run test -- src/api/backendConfig.test.ts` 通过；本地存储 key 和读写行为稳定。

### 任务 #2: 增加轻量 workspace 列表读取函数

**Status:** Finished

**Files:** Modify `src/api/client.ts`, Modify/Create `src/api/client.test.ts`

**功能:** 复用现有 API 基础设施读取 `GET /workspaces`，供登录入口加载 workspace 列表。

**实现说明:** 不新增独立 `WorkspacesClient`。在现有 API 层暴露轻量函数，例如 `listWorkspaces()`，内部使用 `requestJson<ListWorkspacesResponse>(resolveDefaultApiBaseUrl(), "/workspaces")`。函数只负责请求和返回响应，不负责选择默认 workspace、不负责持久化、不负责进入首页。测试覆盖请求路径、base URL resolver、错误透传和响应返回。

**预期验证结果:** `npm run test -- src/api/client.test.ts` 或对应现有 API 测试通过；`GET /workspaces` 路径和 base URL 行为可验证；没有新增不必要的 client 抽象。

### 任务 #3: 调整默认 notes client workspace scope

**Status:** Finished

**Files:** Modify `src/api/client.ts`, Modify `src/api/notes.client.test.ts`

**功能:** 默认 notes client 不再静默调用 `/workspaces` 并取第一项，改为从环境变量或本地保存 workspace id 获取 scope。

**实现说明:** `resolveDefaultWorkspaceId()` 优先返回 `VITE_ZEMBRA_WORKSPACE_ID`，否则读取 `getConfiguredWorkspaceId()`；两者都为空时抛出明确错误。移除默认 client 内部的 `/workspaces` 自动选择和缓存第一项逻辑。测试覆盖保存 workspace id 被用于 notes 请求 query，缺失 workspace id 时抛错，环境变量存在时仍优先使用环境变量。

**预期验证结果:** `npm run test -- src/api/notes.client.test.ts` 通过；note CRUD、recent、stats 和 preview 相关请求 scope 来源明确。

## Stage #2: 登录入口状态与 UI 行为

### 任务 #1: 扩展 BackendUrlGate 状态模型

**Status:** Finished

**Files:** Modify `src/app/BackendUrlGate.tsx`

**功能:** 让入口页在同一表单内管理 Backend 检查、workspace 加载、workspace 选择和进入首页状态。

**实现说明:** 保留当前 host + port 输入。新增 workspace 列表、选中 workspace id、workspace 加载状态和 workspace 错误状态。初始化时如果存在已保存 Backend URL，先检查 `GET /health`，可达后加载 `GET /workspaces`，再校验已保存 workspace id。已保存 workspace 失效时调用清空 helper，停留入口页并显示提示。

**预期验证结果:** 状态流符合设计文档：未连接时 workspace 下拉为空；后端可达后加载列表；空列表和加载失败都不进入首页。

### 任务 #2: 实现 workspace 下拉与刷新图标按钮

**Status:** Finished

**Files:** Modify `src/app/BackendUrlGate.tsx`

**功能:** 在登录页增加 Workspace label、下拉条和右侧图标按钮；图标按钮只负责检查 Backend 并调用 `GET /workspaces`。

**实现说明:** 使用现有窄表单结构。Backend 行不增加任何箭头按钮。Workspace 行固定存在，未加载时为空且不可选；加载成功后选项展示 `workspace_name || workspace_id.slice(0, 8)` 和 `visible_note_count`。右侧图标按钮使用 lucide 或现有图标库中的刷新/加载含义图标，提供 `aria-label`。默认选中 `visible_note_count` 最大的 workspace；并列时选择后端返回顺序靠前的一项。

**预期验证结果:** 四个 UI 状态控件数量一致；Workspace label 不丢失；Backend 输入组合与 Workspace 主框视觉宽度一致；图标按钮不会触发进入首页。

### 任务 #3: 保留底部提交按钮作为进入首页动作

**Status:** Finished

**Files:** Modify `src/app/BackendUrlGate.tsx`

**功能:** 底部提交按钮用于确认选中 workspace、保存 workspace id 并渲染首页。

**实现说明:** 底部按钮保留整行按钮形态，文案切换为进入 Zembra。没有可用 workspace、正在检查 Backend、正在加载 workspace 或 workspace 加载失败时禁用。提交时保存当前 workspace id，记录成功日志，然后把 gate 状态切到 ready。禁止把进入首页动作绑定到 Workspace 右侧图标按钮。

**预期验证结果:** 选中 workspace 后点击底部按钮才进入首页；图标按钮只刷新列表；空列表时不能进入首页。

### 任务 #4: 补充登录入口日志与错误提示

**Status:** Finished

**Files:** Modify `src/app/BackendUrlGate.tsx`

**功能:** 覆盖 Backend 检查、workspace 加载、空列表、保存选择和失效回退的关键日志与错误提示。

**实现说明:** 使用 `console.info` 记录开始和成功路径，使用 `console.warn` 记录不可达、加载失败和已保存 workspace 失效。日志禁止记录敏感信息；workspace id 最多记录前八位。错误提示继续使用 `role="alert"`。

**预期验证结果:** 失败路径都有用户可见提示；关键状态变化有合理日志；不会泄露密钥类信息。

## Stage #3: i18n 与行为测试

### 任务 #1: 补齐三语 i18n 文案

**Status:** Finished

**Files:** Modify `src/i18n/locales/zh-CN/common.ts`, Modify `src/i18n/locales/en-US/common.ts`, Modify `src/i18n/locales/zh-TW/common.ts`, Modify `src/i18n/resources.test.ts`

**功能:** 增加 workspace 选择入口所需文案和按钮可访问名称。

**实现说明:** 增加 `workspaceLabel`、`workspacePlaceholder`、`loadWorkspacesAction`、`refreshWorkspacesAction`、`enterAction`、`loadingWorkspaces`、`noWorkspaces`、`workspacesUnavailable`、`savedWorkspaceUnavailable`、`noteCount` 等 key。保持三语结构一致。

**预期验证结果:** `npm run test -- src/i18n/resources.test.ts` 通过。

### 任务 #2: 覆盖 BackendUrlGate workspace 行为

**Status:** Finished

**Files:** Modify/Create `src/app/App.test.tsx` 或 Create `src/app/BackendUrlGate.test.tsx`

**功能:** 自动化验证登录入口的 workspace 加载、默认选择、持久化、失效回退和空列表行为。

**实现说明:** 使用 Testing Library 和 fetch mock。测试只断言可访问名称、用户可见文案、`localStorage` 结果和 API 请求，不断言 Tailwind class 或固定样式。覆盖初始无 Backend URL、点击 Workspace 右侧图标按钮触发 `GET /health` 与 `GET /workspaces`、默认选择最多笔记 workspace、无 name 时展示前八位 hash、底部提交保存 workspace 并进入首页、已保存 workspace 失效后清空选择、空列表不进入首页。

**预期验证结果:** `npm run test -- src/app/App.test.tsx` 或对应新测试文件通过。

### 任务 #3: 覆盖 API scope 回归

**Status:** Finished

**Files:** Modify `src/api/notes.client.test.ts`, Modify/Create `src/api/client.test.ts`

**功能:** 确认 note API 使用选中 workspace id，workspace list API 通过轻量读取函数发起。

**实现说明:** API 测试覆盖 recent notes、daily counts、get note、create、update、delete 的 `workspace_id` query。确认默认 notes client 缺少 workspace id 时抛出明确错误，避免继续静默选择 `/workspaces` 第一项。`GET /workspaces` 测试只覆盖轻量函数请求路径和响应返回，不引入独立 client 接口。

**预期验证结果:** API 测试通过；workspace scope 行为不再隐藏在 notes client 内部；workspace 列表读取没有过度抽象。

## Stage #4: 整体验证与计划回写

### 任务 #1: 运行自动化验证

**Status:** Designed

**Files:** Verify `package.json`, Verify `src/app/BackendUrlGate.tsx`, Verify `src/api/client.ts`

**功能:** 确认本需求涉及的测试、类型检查和构建通过。

**实现说明:** 运行 `npm run test` 和 `npm run build`。如果单项测试先失败，先运行更小范围测试定位，再恢复全量验证。

**预期验证结果:** `npm run test` 通过；`npm run build` 通过。

### 任务 #2: 手工 UI 检查

**Status:** Designed

**Files:** Verify `http://localhost:5173/`

**功能:** 在浏览器中确认登录页四个状态和布局稳定性。

**实现说明:** 启动或复用 Vite dev server。检查未连接后端、workspace 已加载、下拉展开、空 workspace 四个状态。重点检查 Backend label、Workspace label、Backend 输入、Workspace 下拉、Workspace 右侧图标按钮、底部提交按钮都存在；Backend 行没有图标按钮；Backend 输入组合和 Workspace 主框视觉宽度一致；长 workspace 名不挤掉 note count。

**预期验证结果:** UI 和设计文档一致；没有控件缺失、重叠、错位或误导性动作。

### 任务 #3: 更新计划状态并提交

**Status:** Designed

**Files:** Modify `docs/exec-plans/active/home-ui/r018-login-workspace-selector.md`

**功能:** 根据实际开发结果更新任务状态，并按 Stage 创建原子提交。

**实现说明:** 每个 Stage 完成后把对应任务状态更新为 `Finished`，并按项目规则提交。未经用户验收，不移动到 `docs/exec-plans/completed/`，不更新 `docs/PROGRESS.md`。

**预期验证结果:** active 计划准确反映进度；每个完成的 Stage 都有对应提交；工作区不包含无关改动。

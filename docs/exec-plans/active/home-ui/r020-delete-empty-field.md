# r020-delete-empty-field 开发计划

## 关联设计文档

- 需求澄清文档：`docs/request-clarify/home-ui/r020-delete-empty-field.md`
- 设计文档：`docs/design-docs/home-ui/r020-delete-empty-field.md`

## Stage #1: API 契约与 store 删除能力

### 任务 #1: 扩展 taxonomy 删除 API

**Status:** Designed

**Files:** Modify `src/api/types.ts`, Modify `src/api/taxonomy.client.ts`, Modify `src/api/client.ts`, Modify `src/api/taxonomy.client.test.ts`

**功能:** 为前端 taxonomy 边界增加 `deleteField(fieldId)`，HTTP 实现调用实时 OpenAPI 已确认的 `POST /fields/delete`，请求体包含 `field_id` 和当前 `workspace_id`。

**实现说明:** 在 `src/api/types.ts` 增加 `DeleteFieldRequest` 和 `DeleteFieldResponse` 类型，并为字段成员补充注释。`TaxonomyClient` 增加 `deleteField(fieldId: string): Promise<void>`。`createTaxonomyHttpClient()` 增加 `workspaceId` resolver 配置，复用 `src/api/client.ts` 现有 `resolveDefaultWorkspaceId()`。mock taxonomy client 增加 no-op delete。不要新增独立 field client，不要猜测 `DELETE /fields/{id}` 路径。

**预期验证结果:** `src/api/taxonomy.client.test.ts` 覆盖成功请求 URL、method 和 body；错误响应沿用 `requestJson` 抛出 `ApiError`。运行定向 API 测试通过。

### 任务 #2: 扩展 note store field 删除 action

**Status:** Designed

**Files:** Modify `src/features/notes/noteStore.ts`, Verify `src/pages/home/HomePage.test.tsx`

**功能:** 增加 `deleteField(fieldId)` store action，删除成功后刷新 fields，当前选中 field 被删除时切回 All。

**实现说明:** action 调用 `taxonomyClient.deleteField(fieldId)`，成功后 `taxonomyClient.listFields()` 刷新字段列表。同一次状态更新中，如果 `selectedField === fieldId`，将 `selectedField` 设为 `undefined`。失败时不修改 `fields` 和 `selectedField`，错误继续向调用方抛出。不要重载 note 删除 action，也不要让 UI 直接调用 HTTP client。

**预期验证结果:** 通过 Home 集成测试或 store 级断言证明删除当前 selected field 后切回 All，删除失败不改变本地 field 状态。

## Stage #2: Fields 侧栏删除交互

### 任务 #1: 为 NavItem 增加可选删除 slot

**Status:** Designed

**Files:** Modify `src/pages/home/HomeSidebar.tsx`, Modify `src/pages/home/HomePage.test.tsx`

**功能:** `NavItem` 支持只在 field count 为 0 时显示的删除按钮，hover/focus 右侧 count slot 时从数字 `0` 切换为红色删除图标。

**实现说明:** 为 `NavItem` 增加可选 `deleteLabel`、`deleteDisabled`、`onDelete` props。只有 field 行传入 `onDelete` 且 count 为 0 时渲染删除按钮。删除按钮点击必须阻止冒泡，避免触发行选中。右侧 slot 保持稳定宽度，count 文本和图标共享位置。使用 lucide-react 的 `Trash2` 图标，不新增 SVG。Roles、Tags、All field 行不传删除 props，保持现有行为。

**预期验证结果:** UI 测试覆盖 count 为 0 的 field 存在删除按钮，count 大于 0 的 field 不存在删除按钮；点击删除按钮不触发 field 筛选。

### 任务 #2: 实现应用内确认弹层和页面状态

**Status:** Designed

**Files:** Modify `src/pages/home/HomePage.tsx`, Modify `src/i18n/locales/zh-CN/home.ts`, Modify `src/i18n/locales/zh-TW/home.ts`, Modify `src/i18n/locales/en-US/home.ts`, Modify `src/i18n/resources.test.ts`, Modify `src/pages/home/HomePage.test.tsx`

**功能:** 点击空 field 删除按钮后打开应用内确认弹层。确认调用 store 删除 action，取消关闭弹层。删除成功后弹层关闭，失败时展示错误反馈。

**实现说明:** `HomePage` 增加 `pendingDeleteField`、`isFieldDeleting`、`fieldDeleteError` 状态。确认弹层使用现有主题 token 和小型固定 overlay，不用 `window.confirm`。确认按钮删除中禁用并显示删除中文案。捕获 `ApiError`，409 显示 `field.delete.errorInUse`，其他错误优先显示 error message 或 `field.delete.errorGeneric`。成功后清空弹层状态。补齐三语言 `home.field.delete.*` key。

**预期验证结果:** Home UI 测试覆盖打开弹层、取消不调用删除、确认成功后 field 消失且 All 选中、失败时弹层保留并显示错误文案。i18n 资源完整性测试通过。

## Stage #3: 验证、计划回写和提交

### 任务 #1: 运行定向和全量验证

**Status:** Designed

**Files:** Verify `src/api/taxonomy.client.test.ts`, Verify `src/pages/home/HomePage.test.tsx`, Verify `src/i18n/resources.test.ts`, Verify `src/features/notes/noteStore.ts`, Verify `src/pages/home/HomeSidebar.tsx`

**功能:** 确认 API、store、UI、i18n 和构建均满足 r020 验收标准。

**实现说明:** 优先运行 `npm run test -- src/api/taxonomy.client.test.ts src/pages/home/HomePage.test.tsx src/i18n/resources.test.ts`，再运行 `npm run test` 和 `npm run build`。如果本机 Homebrew Node 仍因 `libllhttp.9.3.dylib` 缺失无法运行 npm 脚本，使用 bundled Node 执行等价入口：`./node_modules/vitest/vitest.mjs run ...`、`./node_modules/typescript/bin/tsc -b`、`./node_modules/vite/bin/vite.js build`，并在计划执行记录里写明。

**预期验证结果:** 定向测试、全量测试和 build 通过；没有新增依赖；工作区只包含 r020 相关代码和文档改动。

### 任务 #2: 更新计划状态并提交

**Status:** Designed

**Files:** Modify `docs/exec-plans/active/home-ui/r020-delete-empty-field.md`, Verify git status

**功能:** 根据实际执行结果更新本计划任务状态和验证记录，完成有效 git 提交。

**实现说明:** 每个 Stage 完成后按项目规则进行原子提交。提交信息使用 Conventional Commits，例如 `feat(home): delete empty fields`。未经用户验收，不移动到 `docs/exec-plans/completed/`，不更新 `docs/PROGRESS.md` 归档项。

**预期验证结果:** git status 干净，提交包含 r020 的设计、计划、实现和测试改动。

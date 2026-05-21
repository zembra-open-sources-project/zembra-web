# r009-edit-note 执行计划

日期：2026-05-21

## 关联设计文档

- 需求澄清文档：`docs/request-clarify/home-ui/r009-edit-note.md`
- 设计文档：`docs/design-docs/home-ui/r009-edit-note.md`

## Stage #1: API 与 Store 契约

### Task #1: 更新 note API 类型与 client

**Status:** Finished

**Files:** Modify `src/api/types.ts`, `src/api/notes.client.ts`, `src/api/notes.client.test.ts`

**Function:** 让前端 `UpdateNoteInput` 支持后端新增的 `field` 和 `tags` 字段，并在 `NotesClient.updateNote()` 中按 `PATCH /notes/{note_ref}` 契约提交。

**Implementation Notes:** `field` 类型使用 `string | null | undefined`，其中 `null` 表示 inbox，`undefined` 表示不显式传递；`tags` 使用 `string[] | undefined`。更新测试需要断言请求体包含 `content`、`device_id`、`field`、`tags`，并确认更新后仍通过 `GET /notes/{note_ref}/tags` 补齐 DTO tags。

**Expected Verification Result:** `npm run test -- src/api/notes.client.test.ts` 通过；测试能捕获 update payload 中缺少 `field` 或 `tags` 的回归。

### Task #2: 扩展 notes store 更新能力

**Status:** Finished

**Files:** Modify `src/features/notes/noteStore.ts`

**Function:** 新增 `updateNote(noteRef, input)` action，供首页编辑态提交后更新 recent notes 列表。

**Implementation Notes:** 调用 `notesClient.updateNote()` 后，将返回 note 移到 `notes` 顶部，去重并限制最多 50 条；随后刷新 `taxonomyClient.listFields()` 和 `taxonomyClient.listTags()`，保持侧边栏数据同步。保持现有 `createNote` 和 `deleteNote` 行为不变。

**Expected Verification Result:** 后续 UI 测试或 store 测试中，更新 note 后列表顶部为更新后的 note，fields/tags 会重新加载。

## Stage #2: 解析规则与共享编辑 UI

### Task #3: 抽取正文解析工具

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`

**Function:** 在首页模块内明确 `#tag` 和 `@field` 解析规则，提交编辑时使用解析结果生成 `UpdateNoteInput`。

**Implementation Notes:** 保留现有 `parseTagNames(content)` 行为；新增 `parseFieldNames(content)`，匹配正文中所有 `@field`。提交时使用第一个 field；没有 field 时提交 `field: null`；多个 field 时 UI 显示 warning。解析函数保持纯函数，便于通过 HomePage 测试间接覆盖。

**Expected Verification Result:** 多个 `@field` 的正文只提交第一个 field；无 `@field` 的正文提交 `field: null`；`#tag` 列表作为完整替换数组提交。

### Task #4: 抽取可复用 NoteEditor

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`

**Function:** 将当前底部 composer 的 textarea、工具栏和提交按钮抽为可复用编辑输入 UI，创建 note 和编辑 note 共用同一套视觉和工具按钮。

**Implementation Notes:** `NoteEditor` 接收草稿、提交状态、placeholder、工具栏、提交回调、草稿更新回调、可选取消回调和可选 warning 文案。创建态不显示取消按钮；编辑态显示取消按钮并支持 `Esc` 取消。保持现有布局尺寸和主题 token，不新增 UI 依赖。

**Expected Verification Result:** 底部创建 composer 视觉和行为保持不变；编辑态 card 内 textarea 和工具栏与 composer 风格一致。

## Stage #3: Note Card 编辑交互

### Task #5: 接入单 note 编辑状态

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`

**Function:** 在 `HomePage` 管理 `editingNoteId`、`editDraft` 和 `isUpdating`，让 `NoteCard` 根据当前状态渲染展示态或编辑态。

**Implementation Notes:** 双击展示态 note card 时，如果当前没有编辑目标，则设置 `editingNoteId` 和 `editDraft`；如果正在编辑其他 note，则忽略双击。提交成功后清空编辑状态；失败时保留草稿。按 `Esc` 或取消按钮退出编辑态。

**Expected Verification Result:** 同一时间只有一个 note card 能进入编辑态；编辑草稿存在时，双击其他 note 不会切换目标。

### Task #6: 实现编辑提交和 warning bubble

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`, `src/i18n/locales/zh-CN/home.ts`, `src/i18n/locales/zh-TW/home.ts`, `src/i18n/locales/en-US/home.ts`

**Function:** 编辑提交时调用 store 的 `updateNote`，并在正文包含多个 `@field` 时显示 warning bubble。

**Implementation Notes:** 提交按钮在草稿 trim 后为空或 `isUpdating` 时禁用。提交 payload 包含 `content`、`field` 和 `tags`；`field` 为第一个 `@field` 或 `null`；`tags` 为重新解析出的完整 tag 列表。warning bubble 使用 i18n key `note.edit.warningMultipleFields`，占位符为第一个 field 名称。

**Expected Verification Result:** 多个 `@field` 出现时展示 warning；提交 payload 只保留第一个 field；成功后 card 展示更新后的内容并退出编辑态。

## Stage #4: 验证与记录

### Task #7: 补充首页交互测试

**Status:** Finished

**Files:** Modify `src/app/App.test.tsx` 或 Create/Modify relevant HomePage test file

**Function:** 覆盖双击进入编辑、提交更新、多 field warning 和编辑中禁用其他 note 双击。

**Implementation Notes:** 优先沿用现有测试模式 mock client，避免依赖本地后端。测试应验证用户可观察行为和关键请求输入，避免绑定过多 CSS 细节。

**Expected Verification Result:** 定向 UI 测试通过，能防止编辑入口、warning 和单编辑目标规则回归。

### Task #8: 执行整体验证并回写计划

**Status:** Designed

**Files:** Modify `docs/exec-plans/active/home-ui/r009-edit-note.md`

**Function:** 运行自动化测试和构建，记录实现进度、验证命令和结果。

**Implementation Notes:** 运行 `npm run test` 和 `npm run build`。完成 Stage 后按项目规则进行一次 conventional commit，提交信息必须符合仓库 Git Commit 防火墙，例如 `feat: add inline note editing flow`。

**Expected Verification Result:** `npm run test` 和 `npm run build` 通过；执行计划状态和开发记录已更新。

## 开发记录

- 2026-05-21：已完成需求澄清、设计文档和执行计划。确认编辑态基于正文重新解析 `#tag` 与第一个 `@field`，多个 field 通过 warning bubble 提示，只允许一个 note 处于编辑态。
- 2026-05-21：已完成 API 类型、notes client、store update action、共享 NoteEditor、note card 双击编辑、warning bubble 和 i18n 文案实现。
- 2026-05-21：已新增 `src/pages/home/HomePage.test.tsx`，覆盖双击进入编辑、多个 `@field` warning、编辑中禁止切换其他 note、提交后退出编辑态。

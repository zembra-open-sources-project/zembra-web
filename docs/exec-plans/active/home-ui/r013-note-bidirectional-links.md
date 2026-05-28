# r013-note-bidirectional-links 执行计划

日期：2026-05-28

## 关联设计文档

- 需求澄清文档：`docs/request-clarify/home-ui/r013-note-bidirectional-links.md`
- 设计文档：`docs/design-docs/home-ui/r013-note-bidirectional-links.md`

## Stage #1: API 与解析契约

### 任务 #1: 扩展 note links 类型与 HTTP client

**Status:** Finished

**Files:** Modify `src/api/types.ts`, `src/api/notes.client.ts`, `src/api/notes.client.test.ts`

**Function:** 让前端 API 边界支持后端 `links` 契约，并统一处理单 note 接口返回的 `NoteResponse`。

**Implementation Notes:** 新增 `NoteLinkInput`，字段为 `targetNoteRef`、`anchorText?`、`position?`；发送请求时映射为 `target_note_ref`、`anchor_text`、`position`。新增 `NoteLinkRecord` 和 `NoteMetadata` 中的 `outgoing_links`、`backlinks` 类型。`createNote()` 请求体增加 `links: input.links ?? []`。`updateNote()` 请求体增加 `links: input.links`，调用方会显式传入解析结果。`getNote()` 和 `updateNote()` 按 `NoteResponse` 映射，避免和当前 OpenAPI 返回结构不一致。

**Expected Verification Result:** `npm run test -- src/api/notes.client.test.ts` 通过；测试能断言 create/update payload 包含 `links`，并验证 `getNote()` 可从 `NoteResponse` 映射为 `NoteDto`。

### 任务 #2: 增加正文双链解析工具

**Status:** Finished

**Files:** Modify `src/pages/home/homeUtils.ts`, Create/Modify `src/pages/home/homeUtils.test.ts`

**Function:** 提供首页可复用的 `[[完整uuid]]` 解析、短 uuid 格式化和展示 segment 拆分能力。

**Implementation Notes:** `parseNoteLinks(content)` 只识别 32 位十六进制 uuid，返回 `{ targetNoteRef, anchorText, position }[]`，重复出现保留多条。`formatShortNoteRef(noteRef)` 返回前 6 位。`parseRenderableNoteContent(content)` 将正文拆为 text/link segment，便于 `NoteCard` 渲染 link segment。非法格式不生成 link segment，保留原文本。保持函数纯净，不访问 DOM、store 或 i18n。

**Expected Verification Result:** 定向测试覆盖完整 uuid、大小写 hex、重复引用、position、非法短 uuid 和普通正文混排。

## Stage #2: Store 与提交链路

### 任务 #3: 扩展 notes store 的预览读取能力

**Status:** Finished

**Files:** Modify `src/features/notes/noteStore.ts`

**Function:** 为 hover 预览提供“先查当前 feed，未命中再远程读取”的 note preview 能力。

**Implementation Notes:** 增加 `notePreviewById` 缓存和 `loadNotePreview(noteRef)` action。action 先在 `notes` 中按完整 id 查找，命中则返回；再查 `notePreviewById`；未命中时调用 `notesClient.getNote(noteRef)`，成功后写入缓存并返回。失败时抛出给 UI 显示不可用状态。不要把远程预览 note 插入 `notes`，不要刷新 fields/tags/daily counts。

**Expected Verification Result:** 后续 UI 测试中，当前 feed 命中时不发额外请求；未命中时能通过 store action 得到目标 note。

### 任务 #4: 在新建和编辑提交中发送 links

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`

**Function:** 新建和编辑 note 时从正文解析 `links`，并随 create/update 提交给后端。

**Implementation Notes:** `handleCreateSubmit()` 在解析 tags 的同时调用 `parseNoteLinks(content)`，传入 `createNote({ content, field, role: "Human", tags, links })`。`handleEditSubmit()` 在解析 field/tags 的同时传入 `links`。编辑提交即使没有引用，也传 `links: []`，确保删除引用后清空 outgoing links。后端校验失败时沿用现有 try/finally 行为保留草稿。

**Expected Verification Result:** UI 测试或 store mock 能观察 create/update input 包含解析后的 `links`；删除正文引用后 update input 为 `links: []`。

## Stage #3: Note Card 菜单与展示交互

### 任务 #5: 增加 note card Mention 动作

**Status:** Finished

**Files:** Modify `src/pages/home/NoteCard.tsx`, Modify `src/i18n/locales/zh-CN/home.ts`, Modify `src/i18n/locales/zh-TW/home.ts`, Modify `src/i18n/locales/en-US/home.ts`

**Function:** 在 note card 三点菜单中增加“Mention”，点击后插入 `[[完整note.id]]`。

**Implementation Notes:** Mention 不使用剪贴板。当前存在编辑态 note 时追加到 `editDraft`；否则追加到底部 `draft`。菜单仍保留删除按钮，删除的危险色样式只用于删除动作，Mention 动作使用普通菜单样式。

**Expected Verification Result:** `HomePage.test.tsx` 中点击“Mention”后，底部草稿或当前编辑草稿出现合法 `[[完整note.id]]`。

### 任务 #6: 渲染短 uuid 与 hover 预览

**Status:** Finished

**Files:** Modify `src/pages/home/NoteCard.tsx`, Modify `src/pages/home/HomePage.tsx`, Modify `src/i18n/locales/zh-CN/home.ts`, Modify `src/i18n/locales/zh-TW/home.ts`, Modify `src/i18n/locales/en-US/home.ts`

**Function:** note card 展示态把 `[[完整uuid]]` 渲染为 6 位短 uuid，并在 hover 时展示引用 note 内容。

**Implementation Notes:** `HomePage` 将 `loadNotePreview` 或等价 callback 传给 `NoteCard`。`NoteCard` 使用 `parseRenderableNoteContent(displayContent)` 渲染正文，link segment 用 button/span 呈现短 uuid。hover/focus 时触发预览读取，预览状态局部保存在 `NoteCard` 内，显示 loading、content 或 unavailable。预览浮层使用现有 CSS token，不参与正文布局；不要把 UI 测试绑定到具体颜色、尺寸或 class。

**Expected Verification Result:** UI 测试能看到短 uuid 而不是完整 `[[uuid]]`；hover 后显示目标 note 内容；远程失败时显示不可用文案。

## Stage #4: 回归验证与计划回写

### 任务 #7: 补充双链自动化测试

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.test.tsx`, Modify `src/api/notes.client.test.ts`, Create/Modify `src/pages/home/homeUtils.test.ts`

**Function:** 覆盖本需求的解析、API payload、复制菜单、提交 links 和 hover 预览关键路径。

**Implementation Notes:** 测试优先验证用户可观察行为、语义结构和请求输入，不断言静态 Tailwind class。Mention 测试覆盖底部草稿和编辑草稿插入。hover 预览测试可通过 store state 预置目标 note 覆盖 feed 命中路径，并通过 mock action 覆盖远程路径。

**Expected Verification Result:** 定向测试能防止 `links` 丢失、短 uuid 渲染失效、复制动作失效和 hover 预览失效。

### 任务 #8: 执行整体验证并回写计划

**Status:** Finished

**Files:** Modify `docs/exec-plans/active/home-ui/r013-note-bidirectional-links.md`

**Function:** 运行自动化测试和构建，记录实现进度、验证命令和结果。

**Implementation Notes:** 运行 `npm run test` 和 `npm run build`。完成每个 Stage 后，如果修改了代码，按项目规则进行一次 git commit。commit message 必须通过仓库 Git Commit 防火墙，例如 `feat: add note bidirectional link UI`。

**Expected Verification Result:** `npm run test` 和 `npm run build` 通过；执行计划中的任务状态和开发记录已更新。

## 开发记录

- 2026-05-28：已完成需求澄清、设计文档和执行计划。确认前端解析 `[[完整uuid]]` 后提交后端 `links`，展示态显示 6 位短 uuid，hover 预览先查当前 feed、未命中再读取后端。
- 2026-05-28：已完成 Stage #1，扩展 note links API 类型和 HTTP client，新增 `parseNoteLinks`、`formatShortNoteRef`、`parseRenderableNoteContent`，并通过 `npm run test -- src/api/notes.client.test.ts` 与 `npm run test -- src/pages/home/homeUtils.test.ts`。
- 2026-05-28：已完成 Stage #2，新增 note preview 缓存读取 action，并在新建、编辑提交中随正文解析并发送 `links`；`npm run test -- src/pages/home/HomePage.test.tsx` 通过。
- 2026-05-28：已完成 Stage #3，note card 三点菜单新增“拷贝链接”，展示态将 `[[完整uuid]]` 渲染为 6 位短 uuid，并支持 hover/focus 加载引用内容预览；`npm run test -- src/pages/home/HomePage.test.tsx` 通过。
- 2026-05-28：已完成 Stage #4，补充双链首页专项测试，覆盖复制完整 note id、短 uuid 展示、hover 预览、新建和编辑提交 links；`npm run test` 通过 13 个测试文件 64 个测试，`npm run build` 通过。
- 2026-05-28：根据 UI 优化反馈，将“拷贝链接”改为“Mention”，点击后自动追加合法 `[[完整note.id]]` 到当前编辑草稿或底部新建草稿；`npm run test -- src/pages/home/HomePage.test.tsx` 通过 7 个测试。

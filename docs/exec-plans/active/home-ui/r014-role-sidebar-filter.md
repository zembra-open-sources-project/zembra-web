# r014-role-sidebar-filter 执行计划

日期：2026-05-30

## 关联设计文档

- 需求澄清文档：`docs/request-clarify/home-ui/r014-role-sidebar-filter.md`
- 设计文档：`docs/design-docs/home-ui/r014-role-sidebar-filter.md`

## Stage #1: API 与数据模型

### 任务 #1: 扩展 note role 类型与 recent notes 请求

**Status:** Finished

**Files:** Modify `src/api/types.ts`, Modify `src/api/notes.client.ts`, Modify `src/api/notes.client.test.ts`

**Function:** 让前端 API 边界保留后端 `NoteRecord.role`，并支持 `POST /notes/recent` 的 `role` 过滤字段。

**Implementation Notes:** `NoteDto` 增加 `role: string`；`RecentNotesQuery` 增加 `role?: string`。`createNotesHttpClient().listRecentNotes()` 在请求体中传入 `role: query.role`，未选 role 时保持 `undefined`，不强制传空字符串。`mapNoteRecordToDto()` 将 `note.role` 映射到 DTO。Mock notes 补齐 `role: "Human"`，避免本地 mock 和测试中出现缺字段。保持当前 `limit` 和 `note_uuid` 行为不变。

**Expected Verification Result:** `npm run test -- src/api/notes.client.test.ts` 通过；测试能断言 `listRecentNotes({ role: "Agent" })` 请求体包含 `role: "Agent"`，并验证后端返回的 role 能进入 `NoteDto.role`。

### 任务 #2: 增加 role 统计工具函数

**Status:** Finished

**Files:** Modify `src/pages/home/homeUtils.ts`, Modify `src/pages/home/homeUtils.test.ts`

**Function:** 为 sidebar Roles 分组提供稳定的 role 计数能力。

**Implementation Notes:** 增加 `countRoles(notes: NoteDto[]): Map<string, number>`。统计时保留后端原始 role 字符串；如果 role 为空字符串，按 UI fallback 需求可在展示层映射为 `Unknown`，工具函数不做多语言处理。现有 `countFields()`、`countTags()` 不改变语义，继续基于当前 `notes` 集合统计。

**Expected Verification Result:** 定向测试覆盖 `Human`、非 `Human`、重复 role 和空 role 计数；现有 tag/field 统计测试继续通过。

## Stage #2: Store 与筛选状态

### 任务 #3: 在 notes store 接入 selectedRole

**Status:** Finished

**Files:** Modify `src/features/notes/noteStore.ts`

**Function:** 保存当前 role 筛选状态，并在 role 切换时重新加载 recent notes。

**Implementation Notes:** 增加 `selectedRole?: string` 和 `setSelectedRole(role?: string)`。`loadRecentNotes()` 读取当前 `selectedRole`，调用 `notesClient.listRecentNotes({ limit: 50, role: selectedRole })`。`setSelectedRole()` 先写入状态，再触发 recent notes 重新加载；实现时要避免读取旧 state 导致请求仍使用旧 role。`selectedField`、`selectedTag` 不因 role 切换而自动清空，继续作为当前 role notes 上的叠加筛选。

**Expected Verification Result:** 后续 HomePage 测试点击 role 后能观察到 recent notes 使用新 role；默认状态下 recent notes 不携带具体 role。

## Stage #3: Sidebar 与 Note Card UI

### 任务 #4: 在 sidebar 增加 Roles 分组

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`, Modify `src/pages/home/HomeSidebar.tsx`, Modify `src/i18n/locales/zh-CN/home.ts`, Modify `src/i18n/locales/zh-TW/home.ts`, Modify `src/i18n/locales/en-US/home.ts`

**Function:** 在 Fields 上方新增 Roles section，默认提供 `全部`，并列出当前 recent notes 中出现过的 role。

**Implementation Notes:** `HomePage` 从 store 读取 `selectedRole`、`setSelectedRole`，用 `countRoles(notes)` 生成 role usage。Roles section 放在 Fields section 上方。`全部` active 条件为 `selectedRole === undefined`，count 为当前 notes 数。具体 role active 条件为 `selectedRole === role`，点击时调用 `setSelectedRole(role)`；再次点击同一 role 可保持选中，不要求实现 toggle。`NavItem` 当前 `prefix` 是字符串，如需要在 Roles 使用 `User`/`Bot` 图标，可将 `prefix` 类型扩展为 `ReactNode`，同时保持 Fields 的 `@` 和 Tags 的 `#` 展示不变。新增 i18n key：`sidebar.roles`、`sidebar.unknownRole`。

**Expected Verification Result:** UI 测试能看到 `Roles`、`全部`、`Human` 等 role nav；默认不选具体 role；点击 role 后触发对应筛选；Fields/Tags count 基于当前 notes 变化。

### 任务 #5: 在 note card 右上角展示 role badge

**Status:** Finished

**Files:** Modify `src/pages/home/NoteCard.tsx`, Modify `src/i18n/locales/zh-CN/home.ts`, Modify `src/i18n/locales/zh-TW/home.ts`, Modify `src/i18n/locales/en-US/home.ts`

**Function:** 每张 note card 在 header 右上角展示创建角色图标和 role 文本。

**Implementation Notes:** 从 `note.role` 读取 role。严格等于 `Human` 时使用 lucide `User` 图标；其他 role 使用 `Bot` 图标。空字符串或缺失展示 `sidebar.unknownRole` 文案，但不翻译后端返回的非空 role 原文。Header 布局使用 flex 分区，badge `shrink-0`，长 role 文本需要截断或限制最大宽度，避免挤压时间和 card 内容。增加可访问名称，例如 `t("note.roleLabel", { role: displayRole })`。

**Expected Verification Result:** UI 测试能断言 `Human` card 有人形 role 标识，非 `Human` card 有 bot role 标识；长或空 role 不破坏渲染。

## Stage #4: 回归验证与计划回写

### 任务 #6: 补充 role sidebar 自动化测试

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.test.tsx`, Modify `src/api/notes.client.test.ts`, Modify `src/pages/home/homeUtils.test.ts`, Modify `src/i18n/resources.test.ts`

**Function:** 覆盖 role API payload、DTO 映射、role 统计、sidebar 交互、Fields/Tags 联动和 note card badge。

**Implementation Notes:** 测试只验证用户可观察行为、语义结构和请求输入，不断言颜色、尺寸或 Tailwind class。HomePage 测试可通过 store 预置不同 role、field、tag 的 notes 来验证联动计数。Role 图标测试优先用可访问名称或 role 文本定位，不绑定 lucide 生成的 SVG 结构。i18n 测试确认新增 key 在三种语言资源中完整存在。

**Expected Verification Result:** 定向测试覆盖默认全部 role、选择 role、清空 role、Field/Tag 联动和 card badge；不会引入静态视觉实现细节断言。

### 任务 #7: 执行整体验证并回写计划

**Status:** Finished

**Files:** Modify `docs/exec-plans/active/home-ui/r014-role-sidebar-filter.md`

**Function:** 运行自动化测试和构建，记录实现进度、验证命令和结果。

**Implementation Notes:** 开发完成后运行 `npm run test` 和 `npm run build`。完成每个 Stage 后，如果修改了代码，按项目规则进行一次 git commit。commit message 必须通过仓库 Git Commit 防火墙，例如 `feat: add role filtering to home sidebar`。

**Expected Verification Result:** `npm run test` 和 `npm run build` 通过；执行计划中的任务状态和开发记录已更新。

## 开发记录

- 2026-05-30：已完成需求澄清和设计文档，并制定本执行计划。实现范围确认：Role 与 Fields/Tags 平级；默认展示全部 role；选择 role 后通过 `POST /notes/recent` 携带 `role` 拉取 notes；note card 右上角展示 Human/User 与非 Human/Bot role badge。
- 2026-05-30：已完成 Stage #1，扩展 `NoteDto.role`、`RecentNotesQuery.role` 和 `POST /notes/recent` role 请求体映射；新增 `countRoles()`，并补充 API 与工具函数测试。`npm run test -- src/api/notes.client.test.ts` 和 `npm run test -- src/pages/home/homeUtils.test.ts` 通过。
- 2026-05-30：已完成 Stage #2，`useNotesStore` 增加 `selectedRole`、`roleNavigationNotes` 和 `setSelectedRole()`，role 切换后按后端 role filter 重新加载 recent notes，并保留 role 导航的全部 role 计数来源。
- 2026-05-30：已完成 Stage #3，首页 sidebar 新增 `Roles` 分组并放在 `Fields` 上方；`NavItem` 支持图标 prefix；note card 右上角展示 Human/User 或非 Human/Bot role badge；三语 i18n 已补齐。
- 2026-05-30：已完成 Stage #4，补充 HomePage role sidebar 与 note card badge 测试。`npm run test` 通过 14 个测试文件 75 个测试，`npm run build` 通过。

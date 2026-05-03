# r002-preview-home-ui 执行计划

日期：2026-05-03

## Related Design Doc

`docs/design-docs/home-ui/r002-preview-home-ui.md`

## Stage #1: 数据层与状态接入

### Task #1: 接入 Fields API

**Status:** Finished

**Files:** Create `src/api/taxonomy.client.ts`; Modify `src/api/types.ts`, `src/api/client.ts`

**Function:** 提供 `FieldsClient.listFields()`，从 `/fields` 读取真实 field 列表并映射为前端 DTO。

**Implementation Notes:** 使用现有 `requestJson`；测试模式提供 mock fields client；不新增依赖。

**Expected Verification Result:** `npm run test` 中新增的 taxonomy client 测试通过。

### Task #2: 扩展 notes store

**Status:** Finished

**Files:** Modify `src/features/notes/noteStore.ts`

**Function:** 增加 `fields`、`selectedField`、`loadFields`、`setSelectedField`，支持 field 展示和选中态。

**Implementation Notes:** notes 本轮先占位，不接当前 `/notes`；后续等 `POST /notes/recent` 提供最近 50 条笔记后再实现真实 feed 和筛选。

**Expected Verification Result:** 首页加载时能加载 fields，选中 field 时 UI 状态正确变化。

## Stage #2: 首页视觉重构

### Task #3: 重构 HomePage 布局

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`, `src/styles/main.css`

**Function:** 按 `preview.html` 实现深色双栏、侧栏统计、热力图占位、Fields 导航、Tags 占位导航、右上搜索占位和笔记占位 feed。

**Implementation Notes:** 保留 `Zembra` 品牌；notes 相关功能先占位；第三项统计占位；卡片菜单、展开和引用只做视觉；移动端做单列适配。

**Expected Verification Result:** App 测试能找到 `Zembra`，构建通过。

### Task #4: 实现底部 Composer 与插入工具

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`

**Function:** 底部悬浮输入框支持输入与格式插入，工具栏支持插入 `#`、`@`、加粗、列表、引用和分隔线。

**Implementation Notes:** 使用 textarea selection API 维护光标；发送按钮本轮只做视觉或本地清空策略，不提交到 notes 后端。

**Expected Verification Result:** 工具按钮通过 textarea selection API 在光标处插入文本，notes 后端不会被调用。

## Stage #3: 验证与收尾

### Task #5: 回归验证与计划更新

**Status:** Finished

**Files:** Modify `docs/exec-plans/active/home-ui/r002-preview-home-ui.md`

**Function:** 运行测试和构建，记录实现与验证结果。

**Implementation Notes:** 完成 Stage 后按项目规则提交一次 conventional commit。

**Expected Verification Result:** `npm run test`、`npm run build` 通过，dev server 可访问。

## 开发记录

- 2026-05-03：已实现 `/fields` taxonomy client、测试模式 mock client 和 field store 状态。
- 2026-05-03：已按 `preview.html` 重构首页为深色工作台；notes、Tags、统计和卡片扩展功能按要求保持占位。
- 2026-05-03：已实现底部 composer 的 `#`、`@`、加粗、列表、引用、分隔线、段落插入工具。
- 2026-05-03：已通过 `npm run test` 和 `npm run build`。

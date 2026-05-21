# r010-daily-note-heatmap 执行计划

日期：2026-05-21

## 关联文档

- 需求澄清文档：`docs/request-clarify/home-ui/r010-daily-note-heatmap.md`
- 设计文档：`docs/design-docs/home-ui/r010-daily-note-heatmap.md`

## Stage #1: API 与状态接入

### Task #1: 接入每日笔记数 API

**Status:** Finished

**Files:** Modify `src/api/types.ts`, `src/api/notes.client.ts`, `src/api/notes.client.test.ts`

**Function:** 为 `GET /notes/stats/daily-counts` 增加前端 API Client 能力。

**Implementation Notes:** 新增 `DailyNoteCount` 和 `DailyNoteCountsResponse` 类型；`NotesClient` 增加 `listDailyNoteCounts()`；mock client 返回最近 30 天示例数据；测试断言请求路径和 DTO 返回。

**Expected Verification Result:** `npm run test -- src/api/notes.client.test.ts` 通过。

### Task #2: 扩展 notes store

**Status:** Finished

**Files:** Modify `src/features/notes/noteStore.ts`

**Function:** 保存并刷新首页热力图需要的每日统计。

**Implementation Notes:** 新增 `dailyNoteCounts` 状态和 `loadDailyNoteCounts()` action；首页初始化加载；创建和编辑 note 成功后刷新统计。

**Expected Verification Result:** 首页测试可以从 store 读到统计并渲染真实日期格。

## Stage #2: 首页日历热力图

### Task #3: 替换热力图占位

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`, `src/i18n/locales/zh-CN/home.ts`, `src/i18n/locales/zh-TW/home.ts`, `src/i18n/locales/en-US/home.ts`

**Function:** 将静态热力格替换为最近 30 天日历热力显示。

**Implementation Notes:** 新增 `DailyNotesHeatmap` 局部组件；根据最大 count 计算 `data-level`；每格包含 `aria-label` 和 `title`；保留桌面侧栏展示，不新增移动端入口。

**Expected Verification Result:** 首页出现接口返回日期，例如 `2026-05-21`，非零日期有对应热力等级。

### Task #4: 补充自动化验证

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.test.tsx`

**Function:** 覆盖首页热力图由 store 数据渲染的行为。

**Implementation Notes:** 使用测试模式 mock client，不依赖真实后端；断言热力图可访问区域、日期 title 和 count 文案存在。

**Expected Verification Result:** `npm run test -- src/pages/home/HomePage.test.tsx` 通过。

## Stage #3: 验证与记录

### Task #5: 执行验证并更新计划

**Status:** Finished

**Files:** Modify `docs/exec-plans/active/home-ui/r010-daily-note-heatmap.md`

**Function:** 运行测试和构建，记录实现结果。

**Implementation Notes:** 运行 `npm run test` 和 `npm run build`。如需要提交，commit message 使用 `feat: add daily note heatmap`，符合 Conventional Commits 防火墙。

**Expected Verification Result:** 测试和构建通过，计划状态更新为 Finished。

## 开发记录

- 2026-05-21：已通过 `http://127.0.0.1:3000/api-docs/openapi.json` 确认 `GET /notes/stats/daily-counts`，并直接请求接口确认返回 2026-04-22 到 2026-05-21 的 30 天每日笔记数。
- 2026-05-21：已完成 API Client、mock client、notes store、首页 `DailyNotesHeatmap`、三语言 i18n 文案和首页测试改造。热力图使用接口返回的 30 天数据，按最大 count 映射 0-4 级热力颜色，新建和编辑 note 成功后刷新统计。
- 2026-05-21：已运行 `npm run test -- src/api/notes.client.test.ts`、`npm run test -- src/pages/home/HomePage.test.tsx`、`npm run test` 和 `npm run build`，全部通过。用户已肉眼验证热力图可用。

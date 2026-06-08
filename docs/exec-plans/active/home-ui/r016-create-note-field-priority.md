# r016-create-note-field-priority 执行计划

日期：2026-06-09

- 需求澄清文档：`docs/request-clarify/home-ui/r016-create-note-field-priority.md`
- 设计文档：`docs/design-docs/home-ui/r016-create-note-field-priority.md`

## Stage #1: 创建路径 field 解析修复

### Task #1: 创建提交使用正文 field 优先

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`

**Function:** 在 `handleCreateSubmit()` 中解析正文 `@field`，优先提交第一个 inline field。

**Implementation Notes:** 复用 `parseFieldNames(content)`；正文没有 field 时保持当前选中 field、再到 `inbox` 的 fallback 顺序。

**Expected Verification Result:** 创建 payload 中的 `field` 符合正文优先规则。

### Task #2: 补充创建路径测试

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.test.tsx`

**Function:** 覆盖创建 note 时 inline field 优先、selected field fallback 和 `inbox` fallback。

**Implementation Notes:** 测试使用通用 field 样例，不绑定截图内容、业务 field 名称或自然语言句式。

**Expected Verification Result:** 相关 HomePage 测试通过。

## 开发记录

- 2026-06-09：已将创建 note 的 field 提交规则调整为正文 `@field` 优先；无 inline field 时继续使用 selected field，最后 fallback 到 `inbox`。

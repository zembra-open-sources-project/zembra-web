# r016-create-note-field-priority 需求澄清

日期：2026-06-09

## 需求结论

本次需求修复首页创建 note 时未正确解释正文 `@field` 的问题。创建 note 的 field 选择应优先来自正文中的第一个 `@field`，而不是直接使用左侧当前选中的 field。

## 已确认范围

| 类型 | 内容 |
| --- | --- |
| In Scope | 创建 note 时解析正文中的 `@field` |
| In Scope | 正文中存在多个 `@field` 时使用第一个 |
| In Scope | 正文中没有 `@field` 时保留现有 fallback：当前选中 field，其次 `inbox` |
| In Scope | 补充自动化测试覆盖创建 payload 的 field 规则 |
| Out of Scope | 绑定任何截图内容、具体 field 名称或自然语言句式 |
| Out of Scope | 修改编辑 note 规则 |
| Out of Scope | 修改 note card 展示去重规则 |

## 验收标准

- 创建正文含任意 `@fieldName` 的 note 时，提交 payload 使用 `fieldName`。
- 创建正文含多个 `@field` 的 note 时，提交 payload 使用第一个 field。
- 创建正文不含 `@field` 且侧栏有选中 field 时，提交 payload 使用选中 field 名称。
- 创建正文不含 `@field` 且侧栏没有选中 field 时，提交 payload 使用 `inbox`。
- 测试不依赖截图内容或固定业务 field 名称。

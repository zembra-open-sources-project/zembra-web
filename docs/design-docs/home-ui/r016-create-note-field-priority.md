# r016-create-note-field-priority 设计文档

日期：2026-06-09

需求澄清文档：`docs/request-clarify/home-ui/r016-create-note-field-priority.md`

## 核心功能

首页创建 note 时统一使用正文解析优先的 field 规则，让创建路径与编辑路径共享同一个 `@field` 解析入口。

## 设计规则

| 场景 | 创建提交 field |
| --- | --- |
| 正文含一个 `@field` | 使用该 field 名称 |
| 正文含多个 `@field` | 使用第一个 field 名称 |
| 正文不含 `@field`，侧栏有选中 field | 使用选中 field 的名称 |
| 正文不含 `@field`，侧栏没有选中 field | 使用 `inbox` |

## 实现边界

| 文件 | 设计 |
| --- | --- |
| `src/pages/home/HomePage.tsx` | `handleCreateSubmit()` 调用 `parseFieldNames(content)`，优先使用第一个解析结果 |
| `src/pages/home/homeUtils.ts` | 继续复用现有 `parseFieldNames()`，不新增第二套正则 |
| `src/pages/home/HomePage.test.tsx` | 通过通用示例验证创建 payload，不绑定截图内容 |

本轮不修改 note card 展示逻辑；正文 marker 是否去重属于展示规则，和创建时 field 提交错误分开处理。

## 验证策略

- UI 单元测试覆盖创建 note 的 inline field 优先、selected field fallback 和 `inbox` fallback。
- 全量测试和构建验证没有回归。

# r020-delete-empty-field 需求澄清

日期：2026-06-27

## 需求背景

当前首页左侧 Fields 列表展示 field 名称和对应可见 note 数量，但没有删除 field 的入口。用户希望对 item count 为 0 的 field 提供轻量删除能力，让不再使用的 field 可以直接从侧栏清理。

## 需求目标

在 Fields 侧栏中，当某个 field 的 item count 为 0 时，用户把指针移动到右侧数字 `0` 上，数字位置应变为红色删除图标。点击删除图标后，应用内弹出二次确认；用户确认后调用后端删除 field API，删除成功后刷新 Fields 列表并保持页面状态闭环。

```text
Fields
  @ All                 11
  @ cancro               5
  @ field                0  -- hover -->  [红色删除图标]
  @ r028-real-sync       0
                              click
                                ↓
                         应用内确认弹层
                                ↓ confirm
                         POST /fields/delete
                                ↓ success
                         刷新 fields，切回 All
```

## 已确认决策

| 决策项 | 结论 |
| --- | --- |
| 需求归属 | 这是一个新的 home-ui 需求，不作为 r019 补充实现。 |
| 删除入口 | 只对 item count 为 0 的 field 展示删除入口。 |
| 触发方式 | 指针移动到数字 `0` 上时，数字变成红色删除图标。 |
| 确认方式 | 必须使用应用内确认弹层，不使用浏览器原生 `window.confirm`。 |
| 删除后筛选状态 | 如果删除的是当前选中的 field，删除成功后切回 Fields 的 All。 |
| 后端契约 | 使用实时 OpenAPI 已确认的 `POST /fields/delete`。 |

## 后端 API 确认

实时 OpenAPI 已确认存在 field 删除接口：

| 项目 | 内容 |
| --- | --- |
| Method | `POST` |
| Path | `/fields/delete` |
| Request body | `{ "field_id": string, "workspace_id": string }` |
| 200 | 返回 `{ "field_id": string, "deleted": boolean }` |
| 404 | workspace 或 field 不存在 |
| 409 | field 仍被 visible notes 使用 |
| 422 | 请求校验失败 |

该接口只允许删除没有 visible notes 使用的 field。前端仍需只在本地 count 为 0 时展示删除入口；如果后端返回 409，界面需要保留 field 并展示失败反馈。

## 仓库现状关联

| 模块 | 当前状态 | 本需求影响 |
| --- | --- | --- |
| `src/api/taxonomy.client.ts` | 只有 `listFields()` 和 `listTags()` | 需要增加 `deleteField(fieldId)`，请求 `/fields/delete` 并携带 workspace scope。 |
| `src/features/notes/noteStore.ts` | 管理 `fields`、`selectedField`、`loadFields()` | 需要增加删除 field action，成功后刷新 fields；如果删除当前 field，切回 All。 |
| `src/pages/home/HomePage.tsx` | 计算 `fieldUsage` 并渲染 Fields 导航 | 需要把删除能力传给 field 导航项，仅对 count 为 0 的 field 启用。 |
| `src/pages/home/HomeSidebar.tsx` | `NavItem` 统一渲染 roles、fields、tags 行 | 需要支持 count 区域 hover 后展示删除按钮，但不能影响 roles/tags 的普通导航行为。 |
| `src/i18n/locales/*/home.ts` | 已有 note 删除文案 | 需要补齐 field 删除确认、删除中、失败反馈等三语言文案。 |

## 范围确认

### In Scope

| 范围 | 说明 |
| --- | --- |
| 空 field 删除入口 | item count 为 0 的 field 数字 hover 后变为红色删除图标。 |
| 应用内二次确认 | 点击删除图标后在应用内确认，不使用浏览器原生确认框。 |
| 后端删除调用 | 调用 `POST /fields/delete`，请求体包含 `field_id` 和当前 workspace id。 |
| 删除成功刷新 | 删除成功后刷新 fields；当前选中项被删除时切回 All。 |
| 错误反馈 | 后端 409、404、422、500 等失败时保留 field，并在界面展示可理解的失败反馈。 |
| 自动化测试 | 覆盖空 field 删除入口、非空 field 不显示删除入口、应用内确认、成功后切回 All、后端失败反馈。 |

### Out of Scope

| 范围 | 说明 |
| --- | --- |
| 删除非空 field | 非空 field 不提供删除入口；后端 409 作为兜底失败处理。 |
| 批量删除 field | 本轮只支持单个 field 删除。 |
| field 重命名或合并 | 属于独立 field 管理能力。 |
| tag 删除 | 本轮只处理 Fields，不处理 Tags。 |
| 后端 schema 或接口变更 | 使用现有实时 OpenAPI，不改后端。 |

## 验收标准

| 编号 | 标准 |
| --- | --- |
| A1 | Fields 列表中 count 为 0 的 field，鼠标 hover 到数字 `0` 时显示红色删除图标。 |
| A2 | count 大于 0 的 field 不显示删除图标。 |
| A3 | 点击删除图标后展示应用内确认弹层，弹层包含 field 名称和确认/取消动作。 |
| A4 | 点击取消后不调用删除 API，field 仍保留。 |
| A5 | 点击确认后调用 `POST /fields/delete`，请求体包含当前 field id 和 workspace id。 |
| A6 | 删除成功后 field 从列表中消失；如果被删除 field 是当前选中筛选项，则切回 All。 |
| A7 | 后端返回 409 或其他错误时，field 仍保留，并展示删除失败反馈。 |
| A8 | 该交互不影响 Roles、Tags 和 All field 导航项的点击筛选行为。 |

# r009-edit-note 需求澄清

日期：2026-05-21

## 需求结论

本次需求是在首页 note feed 中实现编辑 note 功能。用户双击某个 note card 后，该 card 原地进入编辑态，编辑 UI 复用当前底部 note 输入 UI 的 textarea、工具栏和提交按钮风格。用户修改正文后提交，前端重新解析正文中的 `@field` 和 `#tag`，调用后端 `PATCH /notes/{note_ref}` 更新 note。

## 后端契约确认

localhost:3000 的 OpenAPI 文档已确认 `PATCH /notes/{note_ref}` 使用 `UpdateNoteRequest`：

| 字段 | 必填 | 语义 |
| --- | --- | --- |
| `content` | 是 | 新 note 正文 |
| `device_id` | 否 | 更新 revision 的设备标识 |
| `field` | 否 | field 更新；不传保持当前 field，传 `null` 表示 inbox |
| `tags` | 否 | tag 替换列表；不传保持当前 tags，传数组表示完整替换 |

## 已确认范围

| 类型 | 内容 |
| --- | --- |
| In Scope | 双击 note card 进入编辑态 |
| In Scope | 编辑态复用当前 composer 风格的 textarea、工具栏和提交按钮 |
| In Scope | 同一时间只允许编辑一个 note |
| In Scope | 有未提交编辑草稿时，禁用双击其他 note，不切换编辑目标 |
| In Scope | 提交时重新解析正文中的 `#tag`，作为 `tags` 完整替换列表 |
| In Scope | 提交时重新解析正文中的 `@field`，使用第一个 field 作为 `field` |
| In Scope | 正文出现多个 `@field` 时，通过 warning bubble 提示用户只会采用第一个 |
| In Scope | 提交 payload 中只保留第一个 `@field` 对应的 field |
| In Scope | field 编辑语义只来自正文 `@field`，和左侧选中的 field 筛选无关 |
| In Scope | 成功提交后退出编辑态，更新本地 note 列表，并按 recent feed 语义把该 note 放到顶部 |
| In Scope | 失败时保留编辑态和草稿 |
| Out of Scope | 独立 tags/field 编辑器 |
| Out of Scope | revision history 展示 |
| Out of Scope | 多 note 同时编辑 |
| Out of Scope | UI 自动化测试 |

## 交互规则

- 双击展示态 note card 后进入编辑态。
- 编辑态 textarea 默认填入当前 note 正文。
- 编辑态工具栏继续支持插入 `#`、`@`、加粗和列表片段。
- 提交按钮在正文为空或提交中时禁用。
- 按 `Esc` 可取消当前编辑并恢复展示态。
- 当前存在未提交编辑草稿时，其他 note card 的双击编辑入口禁用。
- 正文中没有 `@field` 时，提交 `field: null`，表示归入 inbox。
- 正文中有一个 `@field` 时，提交该 field 名称。
- 正文中有多个 `@field` 时，显示 warning bubble，并在提交时只使用第一个 field 名称。

## 验收标准

- 双击 note card 后，该 card 原地进入编辑态。
- 编辑态 UI 与底部 composer 的视觉和工具按钮行为一致。
- 编辑正文后提交，会调用 `PATCH /notes/{note_ref}`，payload 包含更新后的 `content`、解析出的 `tags` 和第一个 `field`。
- 多个 `@field` 出现时，界面提示用户只采用第一个，并且提交 payload 只发送第一个 field。
- 编辑过程中双击其他 note 不会切换编辑目标。
- 成功提交后 note 内容、tags、field 和更新时间在 feed 中更新。
- `npm run test` 和 `npm run build` 通过。

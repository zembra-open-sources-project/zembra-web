# r009-edit-note 设计文档

日期：2026-05-21

需求澄清文档：`docs/request-clarify/home-ui/r009-edit-note.md`

## 核心功能（WHAT）

在首页 note feed 中为 note card 增加原地编辑能力。用户双击展示态 note card 后进入编辑态，编辑 UI 复用当前底部 composer 的 textarea、工具栏和提交按钮风格。提交时前端重新解析正文中的 `@field` 与 `#tag`，通过后端 `PATCH /notes/{note_ref}` 更新 note。

### 需求背景（WHY）

当前首页已经支持创建、展示、筛选和删除 note，但用户发现内容需要修正时只能删除后重建。编辑能力需要保留当前轻量输入体验，并复用后端 revision、field 和 tags 更新契约，避免 UI 层直接操作数据表或标签关系。

### 需求目标（GOAL）

| 目标 | 说明 |
| --- | --- |
| 原地编辑 | 双击某个 note card 后，该 card 原地进入编辑态 |
| 输入复用 | 编辑态复用当前 composer 的 textarea、工具栏和提交按钮视觉 |
| 正文驱动 | field 和 tags 均从编辑后的正文重新解析 |
| 单编辑目标 | 同一时间只允许编辑一个 note |
| 草稿保护 | 有未提交编辑草稿时，禁用双击其他 note |
| 契约对齐 | 调用 `PATCH /notes/{note_ref}`，提交 `content`、`field`、`tags` |

### 范围边界

| 类型 | 内容 |
| --- | --- |
| In Scope | 更新前端 `UpdateNoteInput` 以支持 `field` 和 `tags` |
| In Scope | `NotesClient.updateNote()` 发送后端支持的新字段 |
| In Scope | notes store 暴露 `updateNote` action，并维护 recent notes 列表 |
| In Scope | 抽取 composer 输入 UI，让创建态和编辑态共享 |
| In Scope | NoteCard 支持双击进入编辑态、提交、取消和 warning bubble |
| In Scope | 多个 `@field` 时提示只采用第一个，并只提交第一个 |
| In Scope | 补充 i18n 文案和自动化测试 |
| Out of Scope | 独立 tags/field 编辑器 |
| Out of Scope | revision history 展示 |
| Out of Scope | 多 note 同时编辑 |
| Out of Scope | UI 自动化测试 |

## 实现流程（HOW）

### 后端 API 契约

| 接口 | 设计 |
| --- | --- |
| Endpoint | `PATCH /notes/{note_ref}` |
| 请求体 | `UpdateNoteRequest` |
| 必填字段 | `content` |
| 可选字段 | `device_id`、`field`、`tags` |
| 返回 | `NoteRecord` |

`field` 和 `tags` 的提交策略如下：

| 正文解析结果 | 提交策略 |
| --- | --- |
| 无 `@field` | 提交 `field: null`，表示归入 inbox |
| 一个 `@field` | 提交该 field 名称 |
| 多个 `@field` | warning bubble 提示用户，只提交第一个 field 名称 |
| 无 `#tag` | 提交空数组 `tags: []`，清空 note tags |
| 一个或多个 `#tag` | 提交解析出的 tag 名称数组，作为完整替换列表 |

### 前端 API 层

| 文件 | 设计 |
| --- | --- |
| `src/api/types.ts` | 为 `UpdateNoteInput` 增加 `field?: string \| null` 和 `tags?: string[]` |
| `src/api/notes.client.ts` | `updateNote()` 请求体发送 `content`、`device_id`、`field`、`tags` |
| `src/api/notes.client.test.ts` | 增加 update note 请求体测试，覆盖 field 和 tags |

`PATCH` 返回 `NoteRecord` 不包含 tags metadata，因此 client 继续沿用当前策略，在更新后调用 `GET /notes/{note_ref}/tags` 补齐 `NoteDto.tags`。

### Store 状态

| 文件 | 设计 |
| --- | --- |
| `src/features/notes/noteStore.ts` | 新增 `updateNote(noteRef, input)` action |

`updateNote` 成功后将返回的 note 合入 recent notes：

| 场景 | 本地列表策略 |
| --- | --- |
| 当前列表已有该 note | 移除旧项，把新项放到顶部 |
| 当前列表没有该 note | 把新项放到顶部，并保持最多 50 条 |
| 更新成功后 | 重新加载 fields 和 tags，保证侧边栏选项和统计同步 |

### UI 组件结构

当前底部 composer 逻辑集中在 `HomePage.tsx`。本轮保持文件内局部组件拆分，不引入新目录或 UI 依赖：

| 组件/函数 | 归属 | 设计 |
| --- | --- | --- |
| `NoteEditor` | `HomePage.tsx` | 共享 textarea、工具栏、提交按钮和 warning bubble |
| `createComposerTools` | `HomePage.tsx` | 继续作为创建态和编辑态共用工具定义 |
| `parseTagNames` | `HomePage.tsx` | 解析正文中的 `#tag` |
| `parseFieldNames` | `HomePage.tsx` | 新增函数，解析正文中的 `@field` |
| `NoteCard` | `HomePage.tsx` | 支持展示态和编辑态切换 |

`NoteEditor` 接收草稿值、提交状态、提交回调、取消回调、工具栏插入回调和 warning 文案。底部创建 composer 和卡片编辑态共用该组件，但创建态不显示取消按钮，编辑态支持 `Esc` 取消。

### 编辑状态归属

编辑态由 `HomePage` 管理，而不是散落在每张 `NoteCard` 内：

| 状态 | 归属 | 说明 |
| --- | --- | --- |
| `editingNoteId` | `HomePage` | 当前正在编辑的 note id |
| `editDraft` | `HomePage` | 当前编辑草稿 |
| `isUpdating` | `HomePage` | 编辑提交中状态 |

这样可以稳定实现“同一时间只允许编辑一个 note”和“有草稿时禁用双击其他 note”。当 `editingNoteId` 已存在且目标 note 不同，其他 note 的双击事件直接忽略。

### 交互细节

| 交互 | 设计 |
| --- | --- |
| 进入编辑 | 双击展示态 note card |
| 禁用切换 | 有编辑目标时，其他 note 双击不进入编辑态 |
| 提交 | 点击编辑态提交按钮 |
| 取消 | 按 `Esc` 或点击编辑态取消按钮 |
| 空正文 | 提交按钮禁用 |
| 更新失败 | 保留编辑态和草稿 |
| 多 field 提示 | 正文中解析到多个 `@field` 时显示 warning bubble |

warning bubble 放在编辑 textarea 下方、工具栏上方或同一输入容器内的弱警告区，使用现有主题 token，不新增视觉体系。

## i18n

本需求涉及新增 note 编辑和 warning 文案。语言文件覆盖 `zh-CN`、`zh-TW`、`en-US`。

| Namespace | Key | 占位符 | zh-CN | en-US |
| --- | --- | --- | --- | --- |
| `home` | `note.edit.cancel` | 无 | 取消编辑 | Cancel edit |
| `home` | `note.edit.saving` | 无 | 保存中 | Saving |
| `home` | `note.edit.warningMultipleFields` | `field` | 检测到多个 Field，本次只使用 @{{field}} | Multiple fields detected. Only @{{field}} will be used. |

回退策略沿用现有 i18n 配置；缺失语言时走默认语言资源。

## 测试用例

| 类型 | 验证 |
| --- | --- |
| API 单元测试 | `updateNote()` 发送 `content`、`field`、`tags`、`device_id` |
| Store 单元/集成测试 | `updateNote` 成功后把 note 移到顶部，并刷新 fields/tags |
| UI 单元测试 | 双击进入编辑态、编辑提交、多个 `@field` warning、编辑中禁用其他 note 双击 |
| 编译检查 | `npm run build` 通过 |
| 回归检查 | `npm run test` 通过 |
| 手工检查 | 首页双击 note、修改正文、验证 field/tag 更新和 warning bubble |

## 风险控制

- 不新增前端依赖，不引入富文本编辑器。
- UI 层只通过 API Client 和 store 更新 note，不直接感知数据库结构。
- field 和 tags 的解析规则集中在纯函数中，便于单元测试覆盖。
- 编辑状态集中在 `HomePage`，避免多卡片编辑状态互相覆盖。

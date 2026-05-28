# r013-note-bidirectional-links 设计文档

日期：2026-05-28

需求澄清文档：`docs/request-clarify/home-ui/r013-note-bidirectional-links.md`

## 核心功能（WHAT）

在首页 note 输入、编辑和展示链路中接入后端双链能力。用户通过 note card 三点菜单复制完整 note uuid，并在正文中使用 `[[<完整uuid>]]` 引用另一条笔记。Web UI 在提交前解析正文里的引用，随 `POST /notes` 或 `PATCH /notes/{note_ref}` 提交结构化 `links`。展示态 note card 将引用渲染为 6 位短 uuid，并在 hover 时展示目标 note 内容预览。

### 需求背景（WHY）

后端已支持 `note_links` 关系维护，且明确 Web UI 负责从正文解析链接，后端负责校验、落库和返回 metadata。当前前端只解析 `#tag` 与 `@field`，note card 菜单也没有提供可复制的 note 引用入口，因此用户无法在 UI 中形成可靠的双链引用。

### 需求目标（GOAL）

| 目标 | 说明 |
| --- | --- |
| 快速插入引用 | note card 菜单提供“Mention”，插入 `[[完整note.id]]` |
| 正文引用语法 | 新建和编辑正文支持 `[[完整uuid]]` |
| 提交结构化 links | 前端解析引用并提交 `links` 数组 |
| 后端校验 | 前端不预校验目标有效性，由 backend 返回错误 |
| 短 uuid 展示 | 展示态将完整引用显示为前 6 位短 uuid |
| hover 预览 | 鼠标悬浮短 uuid 时显示目标 note 内容 |
| 低耦合实现 | UI 层只通过 API Client/store 消费 note 数据，不直接依赖数据库结构 |

### 范围边界

| 类型 | 内容 |
| --- | --- |
| In Scope | `CreateNoteInput`、`UpdateNoteInput` 支持 `links` |
| In Scope | `NotesClient.createNote()` 和 `updateNote()` 发送后端 `links` 字段 |
| In Scope | `getNote()` 兼容后端当前 `NoteResponse` 返回结构 |
| In Scope | 首页解析 `[[完整uuid]]`，提交完整替换 links |
| In Scope | note card 三点菜单增加“Mention”，自动插入合法引用文本 |
| In Scope | note card 展示态渲染短 uuid 和 hover 预览 |
| In Scope | i18n 文案覆盖 `zh-CN`、`zh-TW`、`en-US` |
| In Scope | 补充 API、解析和 UI 行为测试 |
| Out of Scope | 点击短 uuid 跳转目标 note |
| Out of Scope | backlinks 面板、引用统计或关系图 |
| Out of Scope | 自动补全、搜索插入或短 uuid 输入 |
| Out of Scope | 前端提交前逐条校验目标 note |
| Out of Scope | 新增独立 link 管理 API |

## 实现流程（HOW）

### 后端 API 契约

运行中的 `http://localhost:3000/api-docs/openapi.json` 已确认当前契约。

| 接口 | 请求字段 | 响应 |
| --- | --- | --- |
| `POST /notes` | `content`、`field`、`tags`、`role`、`device_id`、`links` | `NoteResponse` |
| `PATCH /notes/{note_ref}` | `content`、`field`、`tags`、`device_id`、`links` | `NoteResponse` |
| `GET /notes/{note_ref}` | path: `note_ref` | `NoteResponse` |

`links` 请求项如下：

| 字段 | 类型 | 必填 | 前端策略 |
| --- | --- | --- | --- |
| `target_note_ref` | string | 是 | 使用 `[[完整uuid]]` 中的 uuid |
| `anchor_text` | string/null | 否 | 使用完整匹配文本，例如 `[[abcd...]]` |
| `position` | integer/null | 否 | 使用匹配开始位置，按 JavaScript 字符串 index 计算 |

创建 note 时，`links` 未传后端按空 links 处理。本轮前端始终发送解析结果，未解析到引用时发送 `links: []`。修改 note 时，`links` 未传表示保留旧链接；本轮编辑提交需要让正文成为关系真源，因此始终发送解析结果，删除所有引用时发送 `links: []` 清空 outgoing links。

### API 类型与映射

| 文件 | 设计 |
| --- | --- |
| `src/api/types.ts` | 新增 `NoteLinkInput`、`NoteLinkRecord`，扩展 `CreateNoteInput`、`UpdateNoteInput`、`NoteMetadata` |
| `src/api/notes.client.ts` | create/update 请求体增加 `links`，get/update 统一兼容 `NoteResponse` |
| `src/api/notes.client.test.ts` | 覆盖 create/update links payload 和 `getNote()` 读取 `NoteResponse` |

当前 `getNote()` 和 `updateNote()` 仍按 `NoteRecord` 读取响应，但后端当前返回 `NoteResponse`。本轮要统一通过 `mapNoteResponseToDto()` 映射单 note 响应，并继续保留 `listRecentNotes()` 对 `ListNotesResponse` + `/tags` 的兼容行为。

`NoteDto` 本轮不需要直接暴露 outgoing/backlinks 给 card 展示，因为展示渲染基于正文中的 `[[uuid]]`。后续 backlinks 面板再扩展 DTO。

### 引用解析规则

| 规则 | 设计 |
| --- | --- |
| 输入格式 | 只识别 `[[<完整uuid>]]` |
| uuid 内容 | 32 位十六进制字符，大小写均可 |
| 短 uuid | `target_note_ref.slice(0, 6)` |
| 重复引用 | 每次出现都生成一条 link，保留不同 `position` |
| 非法格式 | 不生成 link，正文照常显示原文本 |
| 自引用 | 前端不特殊处理，由 backend 校验 |

解析函数放在 `src/pages/home/homeUtils.ts`，保持纯函数：

| 函数 | 责任 |
| --- | --- |
| `parseNoteLinks(content)` | 返回 `NoteLinkInput[]` |
| `parseRenderableNoteContent(content)` | 将正文拆成 plain text 和 link segment，供 `NoteCard` 渲染 |
| `formatShortNoteRef(noteRef)` | 返回 6 位短 uuid |

### Store 状态与 hover 预览

| 状态/动作 | 归属 | 说明 |
| --- | --- | --- |
| `notes` | `useNotesStore` | 当前 recent feed，作为预览的第一优先缓存 |
| `notePreviewById` | `useNotesStore` | 缓存按 uuid 拉取到的预览 note |
| `loadNotePreview(noteRef)` | `useNotesStore` | 先查 `notes` 和缓存，未命中再调用 `notesClient.getNote()` |

hover 预览只需要展示正文摘要，不改变 recent notes 排序，不刷新 taxonomy，也不把目标 note 插入 feed，避免一次 hover 改变用户当前列表。

失败策略：

| 场景 | UI 行为 |
| --- | --- |
| 当前 feed 命中 | 立即显示目标内容 |
| 需要远程加载 | 显示加载中提示 |
| 目标不存在或后端报错 | 显示不可用提示，不阻塞页面 |

### Note Card UI

| 区域 | 设计 |
| --- | --- |
| 三点菜单 | 增加“Mention”，保留“删除” |
| Mention 插入 | 当前有编辑态 note 时插入编辑草稿，否则插入底部新建草稿 |
| 正文渲染 | 保留 tag chip 渲染和展开/收起逻辑，正文文本中 link segment 渲染为短 uuid 按钮/文本 |
| hover 浮层 | 贴近短 uuid 展示，使用现有 surface/border/shadow token |
| 布局稳定 | 浮层使用 absolute 或 portal 式定位，不参与正文流式布局 |

三点菜单中文案需要国际化。Mention 点击后插入 `[[完整note.id]]`，不依赖剪贴板 API，不引入额外依赖。

### 提交流程

新建 note：

| 步骤 | 行为 |
| --- | --- |
| 1 | trim `draft` 得到 `content` |
| 2 | 解析 `tags = parseTagNames(content)` |
| 3 | 解析 `links = parseNoteLinks(content)` |
| 4 | 调用 `createNote({ content, field, role: "Human", tags, links })` |

编辑 note：

| 步骤 | 行为 |
| --- | --- |
| 1 | trim `editDraft` 得到 `content` |
| 2 | 解析 `fieldNames`、`tags`、`links` |
| 3 | 调用 `updateNote(editingNoteId, { content, field, tags, links })` |
| 4 | 成功后退出编辑态，失败时保留草稿 |

## i18n

语言文件覆盖 `src/i18n/locales/zh-CN/home.ts`、`zh-TW/home.ts`、`en-US/home.ts`。

| Namespace | Key | 占位符 | zh-CN | en-US |
| --- | --- | --- | --- | --- |
| `home` | `note.mention` | 无 | Mention | Mention |
| `home` | `note.linkPreview.loading` | 无 | 加载中 | Loading |
| `home` | `note.linkPreview.unavailable` | 无 | 无法加载引用内容 | Preview unavailable |
| `home` | `note.linkPreview.label` | `id` | 引用笔记 {{id}} | Linked note {{id}} |

回退策略沿用现有 i18n 配置；缺失语言时走默认语言资源。

## 测试用例

| 类型 | 验证 |
| --- | --- |
| 解析单元测试 | `parseNoteLinks()` 识别完整 uuid、position、重复引用，并忽略非法格式 |
| API 单元测试 | `createNote()` 和 `updateNote()` 发送 `links`；`getNote()` 正确映射 `NoteResponse` |
| UI 单元测试 | 三点菜单点击“Mention”向当前草稿插入 `[[完整note.id]]` |
| UI 单元测试 | 新建和编辑正文包含 `[[uuid]]` 时触发带 links 的提交路径 |
| UI 单元测试 | 展示态将完整引用显示为 6 位短 uuid |
| UI 单元测试 | hover 短 uuid 时优先显示当前 feed 内容，未命中时调用远程预览 |
| 编译检查 | `npm run build` 通过 |
| 回归检查 | `npm run test` 通过 |
| 手工检查 | 本地后端 3000 启动时，新建/编辑带引用 note，确认后端接受 links 且 hover 可预览 |

## 风险控制

- 不新增前端依赖，保持解析和 hover 逻辑在现有 React/Tailwind/Zustand 架构内完成。
- 不让 UI 组件感知 `note_links` 数据表，只消费 API Client/store 提供的业务对象。
- 修改 note 时始终发送 `links`，确保正文删除引用后后端关系同步清空。
- hover 预览不修改 recent feed，避免悬浮动作改变列表状态。
- 测试只验证语义行为和 API payload，不绑定颜色、尺寸或 Tailwind 原子类。

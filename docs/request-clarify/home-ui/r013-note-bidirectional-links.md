# R013 Note 双链前端接入需求澄清

日期：2026-05-28

## 需求理解

本次需求是在首页 note 输入、编辑和展示链路中接入后端已有双链能力。用户在 note 正文中使用 `[[<完整uuid>]]` 引用另一条笔记，Web UI 在提交前解析这些引用，组装为后端 `links` 结构化字段，并随创建或修改请求提交。后端负责校验引用目标是否存在、是否允许引用以及关系落库。

展示态 note card 不直接显示完整 `[[uuid]]`，而是渲染为目标 note 的 6 位短 uuid。用户鼠标 hover 短 uuid 时，优先从当前已加载 note feed 中读取被引用笔记内容；如果当前列表没有该目标，则通过 `GET /notes/{note_ref}` 拉取目标笔记并显示内容预览。

## 仓库现状关联

| 位置 | 当前能力 | 本需求关系 |
| --- | --- | --- |
| `src/pages/home/NoteCard.tsx` | 已有 note card 展示态、三点菜单和删除动作 | 在三点菜单增加“拷贝链接”，展示正文时渲染双链短 uuid 与 hover 预览 |
| `src/pages/home/HomePage.tsx` | 新建和编辑提交前已解析 `#tag` 与 `@field` | 在同一提交链路中解析 `[[uuid]]` 并传入 create/update action |
| `src/pages/home/homeUtils.ts` | 已承载首页纯解析和格式化函数 | 增加双链解析、短 uuid 格式化和正文渲染辅助逻辑 |
| `src/api/notes.client.ts` | 已封装 `POST /notes`、`PATCH /notes/{note_ref}` 和 `GET /notes/{note_ref}` | 扩展 request/response 类型，发送 `links`，为 hover 预览复用 `getNote` |
| `src/features/notes/noteStore.ts` | 管理 recent notes、create/update/delete 和列表刷新 | 增加读取目标 note 的能力或暴露现有 client 行为给展示层使用 |

## 后端契约确认

运行中的后端 `http://localhost:3000/api-docs/openapi.json` 已确认：

| 场景 | 契约 |
| --- | --- |
| 创建 note | `POST /notes` 的 `CreateNoteRequest.links` 为数组，未传按空 links 处理 |
| 修改 note | `PATCH /notes/{note_ref}` 的 `UpdateNoteRequest.links` 为可选数组，未传保留当前 outgoing links，传 `[]` 清空 |
| link 请求项 | `target_note_ref` 必填，`anchor_text` 可选，`position` 可选 |
| link 响应项 | `metadata.outgoing_links` 和 `metadata.backlinks` 返回 `NoteLinkRecord` |
| target 校验 | 后端校验 `target_note_ref`，前端不预先阻止提交 |

前端本轮按用户要求只接受正文中的完整 note uuid。虽然后端支持唯一前缀，Web UI 输入语法仍限定为 `[[<完整uuid>]]`。

## 范围确认

### In Scope

| 功能 | 说明 |
| --- | --- |
| 拷贝链接 | note card 三点菜单增加“拷贝链接”，复制完整 `note.id` |
| 引用语法 | 新建和编辑输入支持 `[[<完整uuid>]]` |
| 提交解析 | 前端解析正文中的引用，生成 `links: [{ target_note_ref, anchor_text, position }]` |
| 后端校验 | 引用有效性由后端检查；前端只负责解析和提交结构化数据 |
| 展示渲染 | note card 展示态把引用渲染为 6 位短 uuid |
| hover 预览 | hover 短 uuid 时显示被引用 note 内容，优先当前 feed，未命中则 `getNote(uuid)` |
| 测试 | 覆盖解析函数、API request body、复制动作、展示短 uuid 和 hover 预览行为 |

### Out of Scope

| 功能 | 原因 |
| --- | --- |
| 点击跳转目标 note | 本轮只要求 hover 显示引用内容 |
| 反向链接列表 | 后端虽返回 backlinks，但本轮首页不展示 backlinks 面板 |
| 引用自动补全 | 本轮输入方式为手动粘贴完整 uuid |
| 短 uuid 输入 | 用户已确认输入必须使用完整 uuid |
| 前端引用目标预校验 | 用户已确认由 backend 检查引用 |
| 独立 link 管理 API | 本轮只接入 note create/update 的 `links` 字段 |

## 验收标准

| 编号 | 验收项 |
| --- | --- |
| A1 | 点击 note card 三点菜单中的“拷贝链接”后，剪贴板内容为完整 `note.id` |
| A2 | 新建正文包含 `[[完整uuid]]` 时，`POST /notes` 请求体包含对应 `links` |
| A3 | 编辑正文包含 `[[完整uuid]]` 时，`PATCH /notes/{note_ref}` 请求体包含对应 `links` |
| A4 | 编辑正文删除所有引用后，`PATCH /notes/{note_ref}` 发送 `links: []` 清空 outgoing links |
| A5 | 后端返回引用校验错误时，前端保留输入内容并显示现有错误反馈 |
| A6 | note card 展示态把 `[[完整uuid]]` 显示为前 6 位短 uuid |
| A7 | hover 短 uuid 时能看到目标 note 内容预览 |
| A8 | hover 目标不在当前 feed 时，通过 `GET /notes/{note_ref}` 拉取并显示预览 |

## 已确认决策

| 问题 | 决策 |
| --- | --- |
| 后端契约来源 | 以运行中的 `http://localhost:3000/api-docs/openapi.json` 为准 |
| 输入引用 ID | 必须使用完整 uuid |
| 引用有效性 | 由 backend 检查 |
| hover 数据源 | 先查当前 feed，未命中再调用 `getNote(uuid)` |
| 短 uuid 规则 | 显示完整 uuid 的前 6 位 |

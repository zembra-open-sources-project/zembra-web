# r002-preview-home-ui 设计文档

日期：2026-05-03

需求澄清文档：`docs/request-clarify/home-ui/r002-preview-home-ui.md`

## 核心功能（WHAT）

将首页调整为接近 `preview.html` 的深色笔记工作台。首页保留 `Zembra` 品牌，接入真实 fields 数据和 `POST /notes/recent` 最近笔记数据，渲染真实 note feed。

### 需求背景（WHY）

当前首页已完成视觉结构和 Fields 数据边界，后端已提供 `POST /notes/recent`。本轮将首页 feed 从占位数据切换为最近 50 条真实笔记。

### 需求目标（GOAL）

- 还原预览稿的深色布局、卡片层次、侧栏导航、右上搜索和底部 composer。
- 接入后端 `/fields`，在侧栏展示真实 Field 列表。
- 保持首页 feed 不绑定当前 `/notes`，改用 `POST /notes/recent`。
- composer 工具栏支持常用插入能力，降低输入 `#tag`、`@field` 和 Markdown 格式的成本。

### 范围边界

| 类型 | 内容 |
| --- | --- |
| In Scope | 深色首页布局、Zembra 品牌、真实 fields 列表、真实 recent notes feed、tag 导航、keyword 搜索、底部 composer、工具栏插入格式 |
| In Scope | 笔记卡片展示 meta、菜单占位、展开占位、引用占位 |
| In Scope | 统计区先使用视觉占位，第三项使用占位 |
| Out of Scope | 首页接入当前 `/notes`；真实置顶、引用统计和展开折叠仍保持视觉占位 |
| Out of Scope | Command Palette、真实置顶、真实引用统计、真实展开折叠、菜单操作、热力图真实统计 |
| Out of Scope | 富文本编辑器、新 UI 套件、UI 自动化测试 |

## 实现流程（HOW）

### 数据层

| 能力 | 设计 |
| --- | --- |
| Fields 类型 | 在 `src/api/types.ts` 增加 `FieldDto`、`FieldRecord`、`ListFieldsResponse` |
| Fields client | 新建 `src/api/taxonomy.client.ts`，封装 `GET /fields` |
| 默认 client | `src/api/client.ts` 同时导出 `fieldsClient` |
| Store | 新增或扩展 store 状态，至少提供 `fields`、`selectedField`、`loadFields`、`setSelectedField` |
| Recent Notes | `NotesClient.listRecentNotes()` 调用 `POST /notes/recent`，body 默认 `{ "limit": 50 }`，返回 `ListNotesResponse` |

说明：后端 `/fields` 返回 `id` 和 `name`。后端 `POST /notes/recent` 请求体包含可选 `limit` 和 `note_uuid`，默认 50，limit 范围 1 到 100，响应为 `{ notes: NoteRecord[] }`。前端首页本轮只接首屏最近 50 条；游标翻页后续再扩展。

### 首页布局

| 区域 | 设计 |
| --- | --- |
| 根布局 | 深色全屏背景，桌面端两栏居中，左侧约 300px，feed 约 760px |
| 侧栏 | 品牌、统计、热力图占位、Fields、Tags |
| 顶栏 | 右对齐胶囊搜索框，绑定 `keyword` |
| Feed | 使用 recent notes 渲染卡片，卡片显示更新时间、正文、标签 pill 和视觉占位 |
| Composer | 底部固定悬浮输入区，textarea + 工具栏 + 发送按钮视觉；工具按钮支持插入文本 |
| 响应式 | 中等宽度缩小侧栏和间距；移动端改为单列，composer 固定在底部全宽范围内 |

### Composer 插入规则

| 按钮 | 插入内容 | 行为 |
| --- | --- | --- |
| `#` | `#` | 在光标处插入 tag 前缀 |
| `@` | `@` | 在光标处插入 field 前缀 |
| `Aa` | `**选中文本**` 或 `****` | 对选中文本加粗，无选区时插入占位并把光标放中间 |
| 列表 | `\n- ` | 插入 Markdown 无序列表项 |
| 引用 | `\n> ` | 插入 Markdown 引用 |
| 分隔 | `\n---\n` | 插入 Markdown 分隔线 |

### 视觉稳定性

- 卡片和导航项使用固定圆角与稳定 padding，避免 hover 或选中态改变布局尺寸。
- composer 固定底部时给 feed 底部预留空间，避免最后一条笔记被遮挡。
- 搜索框和按钮文本不使用 viewport 字号缩放。
- 工具按钮使用 `lucide-react` 图标和少量文字标记，未实现的视觉占位不绑定破坏性动作。

## 测试用例

| 类型 | 用例 |
| --- | --- |
| 编译检查 | `npm run build` 通过 |
| 单元测试 | `npm run test` 通过，保留 client 测试 |
| 回归检查 | 首页能加载 fields 和 recent notes；测试模式不访问真实后端 |
| 手工检查 | 访问 `http://127.0.0.1:5173/`，确认深色布局、Fields、Tags、搜索和真实 note feed |

# r002-preview-home-ui 设计文档

日期：2026-05-03

需求澄清文档：`docs/request-clarify/home-ui/r002-preview-home-ui.md`

## 核心功能（WHAT）

将首页调整为接近 `preview.html` 的深色笔记工作台。首页保留 `Zembra` 品牌，本轮接入真实 fields 数据，notes feed 先做视觉占位，后续等待后端 `POST /notes/recent` 提供最近 50 条笔记后再接入。

### 需求背景（WHY）

当前首页已能通过 OpenAPI client 读取和创建笔记，但后续首页最近笔记数据源会切换为 `POST /notes/recent`。本轮先把视觉结构和 Fields 数据边界搭好，避免围绕即将变化的 notes API 做重复实现。

### 需求目标（GOAL）

- 还原预览稿的深色布局、卡片层次、侧栏导航、右上搜索和底部 composer。
- 接入后端 `/fields`，在侧栏展示真实 Field 列表。
- 保持 notes 功能占位，不把首页 feed 绑定到当前 `/notes`。
- composer 工具栏支持常用插入能力，降低输入 `#tag`、`@field` 和 Markdown 格式的成本。

### 范围边界

| 类型 | 内容 |
| --- | --- |
| In Scope | 深色首页布局、Zembra 品牌、真实 fields 列表、notes 占位 feed、tag 导航占位、keyword 搜索占位、底部 composer、工具栏插入格式 |
| In Scope | 笔记卡片展示 meta、菜单占位、展开占位、引用占位 |
| In Scope | 统计区先使用视觉占位，第三项使用占位 |
| Out of Scope | 首页接入当前 `/notes`；首页 notes 数据后续使用 `POST /notes/recent` |
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
| Notes 占位 | 首页不调用当前 `/notes` 作为 feed；保留后续 `POST /notes/recent` 接入位置 |

说明：后端 `/fields` 返回 `id` 和 `name`。本轮只在侧栏展示真实 field 列表并支持选中态；notes feed、field 过滤和创建笔记的数据写入等待 `POST /notes/recent` 及后续 notes 写入流程稳定后接入。

### 首页布局

| 区域 | 设计 |
| --- | --- |
| 根布局 | 深色全屏背景，桌面端两栏居中，左侧约 300px，feed 约 760px |
| 侧栏 | 品牌、统计、热力图占位、Fields、Tags |
| 顶栏 | 右对齐胶囊搜索框，绑定 `keyword` |
| Feed | 使用占位笔记卡片列表，卡片显示 meta、正文、标签 pill 和视觉占位 |
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
| 回归检查 | 首页能加载 fields；notes feed 使用占位数据；测试模式不访问真实后端 |
| 手工检查 | 访问 `http://127.0.0.1:5173/`，确认深色布局、Fields、Tags 占位、搜索占位和 composer 插入行为 |

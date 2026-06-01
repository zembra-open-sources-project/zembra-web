# r015-hierarchical-tags-sidebar 设计文档

日期：2026-06-01

需求澄清文档：`docs/request-clarify/home-ui/r015-hierarchical-tags-sidebar.md`

## 核心功能（WHAT）

在首页支持 `zembra-schema v0.4.0` 的二级标签语义。用户在创建或编辑 note 时输入 `#books/hands-on-gpt`，前端继续向后端提交完整 tag path `books/hands-on-gpt`；首页 sidebar 的 Tags 分组从平铺按钮升级为二级折叠树；note card tag chip 使用更清晰的路径表达，例如 `#books > hands-on-gpt` 或等价 icon 连接。

父标签点击后筛选整个子树，子标签点击后精确筛选完整 path。默认只展开当前选中 tag 所在的父节点，未选中时不默认展开全部。

### 需求背景（WHY）

后端已完成 `zembra-schema v0.4.0` 层级标签适配，`TagRecord` 暴露 `name`、`parent_tag_id`、`path`、`depth`，note create/update 的 `tags` 输入继续使用完整 path。当前 web UI 仍把 tag 当成平铺字符串处理，sidebar 不能表达父子关系，note chip 也会把 `books/hands-on-gpt` 显示成一段不易读的文本。

### 需求目标（GOAL）

| 目标 | 说明 |
| --- | --- |
| 完整 path 输入 | 创建和编辑 note 时解析 `#books/hands-on-gpt` 为完整 tag path |
| 结构化 tag DTO | 前端 API 边界保留 `parentTagId`、`path`、`depth` |
| 二级树导航 | Sidebar Tags 支持 root tag 与二级 child tag |
| 子树筛选 | 点击父 tag 时匹配父 path 和所有直接 child path |
| 精确筛选 | 点击二级 tag 时只匹配该完整 path |
| 清晰路径展示 | note chip 和必要的 sidebar 文案使用层级连接符或 icon |
| 稳定展开 | 默认只展开选中 tag 所在父节点，用户可手动折叠/展开 |

### 范围边界

| 类型 | 内容 |
| --- | --- |
| In Scope | 扩展 `TagRecord`、`TagDto` 和 taxonomy 映射 |
| In Scope | 补充二级 tag 解析、去重和渲染测试 |
| In Scope | 新增二级 tag 树构建与筛选工具函数 |
| In Scope | Sidebar Tags 改为二级折叠树 |
| In Scope | 父 tag 筛选整个子树，子 tag 精确筛选 |
| In Scope | note card tag chip 使用更清晰的路径展示 |
| In Scope | HomePage、home utils、taxonomy client 和 i18n 测试 |
| Out of Scope | 任意深度 tag 树 |
| Out of Scope | 标签重命名、移动、删除和 tag 管理页 |
| Out of Scope | 后端 API、schema、migration 或数据库改动 |
| Out of Scope | sync 乱序补偿 |
| Out of Scope | 新增前端依赖 |

## 实现流程（HOW）

### 后端 API 契约

后端 v0.4 契约以 `/tags`、note create/update 和 note metadata 为边界：

| 接口/字段 | 设计使用方式 |
| --- | --- |
| `/tags.tags[].id` | sidebar 树节点 key |
| `/tags.tags[].name` | 当前层级显示名 |
| `/tags.tags[].parent_tag_id` | 构建 root-child 关系 |
| `/tags.tags[].path` | 筛选值、提交值和完整语义标识 |
| `/tags.tags[].depth` | 本轮只接受 `0` 和 `1` 参与二级树；更深层级不作为本轮 UI 目标 |
| note create/update `tags` | 继续传完整 path 字符串数组 |
| note metadata `tags` | 继续作为 note card 和本地筛选的完整 path 字符串来源 |

当前 web 仓库的 `vendor/zembra-schema` 和 `docs/references/shared-schema.md` 可能仍停在旧版本；实现时以前端 API client 和已确认后端文档为准，不让 UI 组件直接读取数据库表结构。

### 数据模型与 API Client

| 文件 | 改动设计 |
| --- | --- |
| `src/api/types.ts` | `TagRecord` 增加 `parent_tag_id?: string \| null`、`path: string`、`depth: number`；`TagDto` 增加 `parentTagId?: string`、`path: string`、`depth: number` |
| `src/api/taxonomy.client.ts` | `mapTagRecordToDto()` 将 snake_case 字段映射为 camelCase；旧 mock tag 补齐 `path` 和 `depth` |
| `src/api/taxonomy.client.test.ts` | 覆盖 root tag、child tag 和 null parent 映射 |

兼容策略：后端 v0.4 是当前目标契约，真实 HTTP 响应应包含 `path` 和 `depth`。测试和 mock 必须更新为 v0.4 形态，避免继续强化旧平铺结构。

### Tag 解析与格式化

| 函数 | 责任 |
| --- | --- |
| `parseTagNames(content)` | 继续返回完整 path 字符串，补充 `#books/hands-on-gpt` 测试 |
| `stripRenderedTagMarkers(content, tags)` | 继续按完整 path 移除已渲染 tag marker |
| `formatTagPathLabel(path)` | 将 `books/hands-on-gpt` 表达为 `books > hands-on-gpt`，供纯文本场景使用 |
| `splitTagPath(path)` | 输出最多二级 path 片段，供 chip 和树节点渲染使用 |

二级约束：实现只面向 root 与 child 两级。若遇到更深 path，可保持完整 path 作为提交和筛选值，并在展示层用连接符按片段展示，但不把 sidebar 扩展为任意深度递归树。

### Tag 树与筛选

新增二级树数据结构建议放在 `src/pages/home/homeUtils.ts`，保持 HomePage 只负责组合状态和渲染：

| 数据 | 说明 |
| --- | --- |
| root node | `depth === 0` 或 `parentTagId` 为空的 tag |
| child node | `depth === 1` 且 `parentTagId` 指向 root 的 tag |
| orphan child | 找不到 parent 的 child 可按 `path` 第一段归入临时 root，避免 UI 丢 tag |
| duplicate path | 以 `path` 作为筛选标识，重复 path 保留第一个稳定节点 |

筛选规则：

| 选中值 | 匹配规则 |
| --- | --- |
| 未选 tag | 不限制 tag |
| 父 tag path，如 `books` | note tags 包含 `books` 或任意以 `books/` 开头的直接子 path |
| 子 tag path，如 `books/hands-on-gpt` | note tags 必须包含完整 path |

`filterVisibleNotes()` 可以继续接收 `tag?: string`，但内部需要借助 tag path 语义判断父子匹配。推荐把 tag filter 判断拆成独立函数，例如 `noteMatchesTagPath(noteTags, selectedTag)`，方便测试。

### Sidebar Tags 交互

`HomePage` 保留 `selectedTag` 为完整 path 字符串，并新增本地展开状态：

| 状态 | 责任 |
| --- | --- |
| `selectedTag` | 当前筛选 path，继续由 `useNotesStore` 持有 |
| `expandedTagRoots` | 当前展开的 root path 集合，由 `HomePage` 本地持有 |

默认展开策略：

| 场景 | 行为 |
| --- | --- |
| 初始未选 tag | 不展开全部 root |
| 选中 root tag | 展开该 root |
| 选中 child tag | 展开其 parent root |
| 用户手动展开/折叠 | 更新 `expandedTagRoots` |
| 清空 selectedTag | 保留用户手动展开状态；不自动展开全部 |

Tags section 推荐结构：

```text
Tags
├─ root row: # books        count
│  └─ child row: hands-on-gpt count
└─ root row: # inbox        count
```

父 row 的主点击区域负责筛选父子树，折叠按钮负责展开状态。为了避免点击目标混乱，展开按钮需要独立 `aria-label`，例如 `展开 books` / `折叠 books`。

### Note Card Tag Chip

`NoteCard` 渲染 tag chip 时不再直接输出 `#{tag}`。推荐使用小型 `TagPathLabel` 组件或局部 helper：

| path | 展示 |
| --- | --- |
| `inbox` | `#inbox` |
| `books/hands-on-gpt` | `#books > hands-on-gpt` 或 `#books` + icon + `hands-on-gpt` |

chip 文本仍要保持可读，长 path 使用现有卡片宽度内的自然换行或截断策略，不添加固定宽高断言。`stripRenderedTagMarkers()` 继续用完整 path 匹配，避免正文里重复显示 `#books/hands-on-gpt`。

### i18n

本需求涉及少量可访问名称和空态文案，覆盖 `zh-CN`、`zh-TW`、`en-US`：

| Namespace | Key | 占位符 | zh-CN | zh-TW | en-US |
| --- | --- | --- | --- | --- | --- |
| `home` | `sidebar.expandTag` | `tag` | 展开 {{tag}} | 展開 {{tag}} | Expand {{tag}} |
| `home` | `sidebar.collapseTag` | `tag` | 折叠 {{tag}} | 收合 {{tag}} | Collapse {{tag}} |
| `home` | `sidebar.tagPathLabel` | `path` | 标签 {{path}} | 標籤 {{path}} | Tag {{path}} |

如果最终实现使用纯文本 `>` 且不新增可访问按钮文案，可以减少 i18n key；但折叠按钮的 `aria-label` 必须可本地化。

## 测试用例

| 类型 | 验证 |
| --- | --- |
| API 单元测试 | `mapTagRecordToDto()` 映射 `parent_tag_id`、`path`、`depth` |
| API 单元测试 | `listTags()` 返回 root 与 child 的 `TagDto` |
| 工具函数测试 | `parseTagNames()` 解析 `#books/hands-on-gpt` |
| 工具函数测试 | `stripRenderedTagMarkers()` 移除完整二级 tag marker |
| 工具函数测试 | tag tree 构建 root-child 关系，孤儿 child 不丢失 |
| 工具函数测试 | 父 tag 筛选匹配 `books` 和 `books/*`，子 tag 只精确匹配 |
| UI 单元测试 | sidebar Tags 默认不展开全部 root |
| UI 单元测试 | 选中 child tag 后只展开对应 parent |
| UI 单元测试 | 点击父 tag 筛选整个子树 |
| UI 单元测试 | 点击子 tag 精确筛选完整 path |
| UI 单元测试 | note card chip 使用清晰路径表达，不重复正文 marker |
| i18n 测试 | 新增 key 在三种语言资源中完整存在 |
| 编译检查 | `npm run build` 通过 |
| 回归检查 | `npm run test` 通过 |

## 风险控制

- UI 组件只消费 API DTO 和 note metadata，不依赖 SQLite 表结构。
- 不新增依赖；icon 使用现有 `lucide-react`。
- `selectedTag` 继续使用完整 path，避免引入独立 id/path 双状态。
- 树构建和筛选规则放在工具函数中测试，减少 HomePage 复杂度。
- 测试只验证用户可观察行为、语义结构、API DTO 和交互结果，不断言 Tailwind class、颜色、尺寸、间距等静态视觉细节。

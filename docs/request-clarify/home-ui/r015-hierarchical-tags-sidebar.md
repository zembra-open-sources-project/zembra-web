# R015 二级标签输入与 Sidebar 树形筛选需求澄清

日期：2026-06-01

## 需求理解

本次需求是让 web UI 跟随后端 `zembra-schema v0.4.0` 的层级标签能力，在首页 note 创建、编辑、展示和 sidebar 筛选中支持二级 tag。用户输入 `#books/hands-on-gpt` 时，前端需要解析并提交完整 tag path `books/hands-on-gpt`；sidebar 的 Tags 分组需要从平铺列表升级为可折叠的二级树。

本轮只处理二级标签，不扩展为任意深度标签管理能力。

## 后端契约确认

后端文档已确认 `zembra-schema v0.4.0` 支持层级 tag，核心契约如下：

| 契约项 | 结论 |
| --- | --- |
| `tags.name` | 当前层级内的标签名，例如 `hands-on-gpt` |
| `tags.parent_tag_id` | 父标签 ID；根标签为空 |
| `tags.path` | 完整标签路径，例如 `books/hands-on-gpt` |
| `tags.depth` | 标签深度；根标签为 `0`，二级标签为 `1` |
| note create/update 输入 | `tags: string[]` 的元素继续使用完整 tag path |
| note metadata | `metadata.tags` 继续返回完整 path 字符串 |
| `/tags` 响应 | 返回结构化 tag 对象，包含 `name`、`parent_tag_id`、`path`、`depth` |

## 仓库现状关联

| 模块 | 当前状态 | 本需求影响 |
| --- | --- | --- |
| `src/api/types.ts` | `TagRecord` 和 `TagDto` 仍是平铺 tag 结构 | 需要接收并保留 `parentTagId`、`path`、`depth` |
| `src/api/taxonomy.client.ts` | `/tags` 映射只使用 `name` | 需要把后端结构化 tag 映射到前端 DTO |
| `src/pages/home/homeUtils.ts` | `parseTagNames()` 已能把斜杠作为 tag 内容的一部分解析 | 需要补充二级 tag 测试，并明确完整 path 语义 |
| `src/pages/home/HomePage.tsx` | Tags sidebar 使用 `tags.map()` 平铺渲染 | 需要构建二级树并管理展开状态 |
| `src/pages/home/HomeSidebar.tsx` | `NavItem` 是单层导航行 | 需要支持二级树节点、展开折叠按钮和选中路径展示 |
| `src/pages/home/NoteCard.tsx` | tag chip 展示完整 `#tag` 文本 | 需要把完整 path 改成更清晰的路径展示 |

## UI 形态确认

Sidebar Tags 推荐形态：

```text
Tags
├─ # books                  12
│  └─ hands-on-gpt           5
├─ # projects                8
│  └─ zembra-web             4
└─ # inbox                   2
```

路径展示推荐形态：

```text
#books > hands-on-gpt
```

如果现有图标体系里有合适的 `ChevronRight` 或同类 icon，可以用 icon 替代 `>` 连接符。视觉表达可以不同，但语义必须清楚表达父子路径，不再把完整 path 原样显示成一段 `books/hands-on-gpt`。

## 已确认决策

| 问题 | 决策 |
| --- | --- |
| 点击父标签的筛选语义 | 筛选整个子树，例如点击 `books` 后显示 `books` 和 `books/*` 的 notes |
| 支持层级深度 | 当前只做二级标签 |
| 完整 path 展示 | 改成更清晰的路径展示，参考 `books > hands-on-gpt` 或 icon 连接 |
| 默认展开策略 | 默认只展开当前选中 tag 所在的父节点 |

## 范围确认

### In Scope

| 范围项 | 目标 |
| --- | --- |
| tag API 类型适配 | 前端接收 v0.4 结构化 tag 字段 |
| tag 输入解析 | `#books/hands-on-gpt` 解析为 `books/hands-on-gpt` 并提交给 create/update |
| tag 展示 | note chip 和 sidebar 使用更清晰的路径表达 |
| sidebar 二级树 | Tags 分组支持 root tag 和二级 tag 的折叠树 |
| 父标签筛选 | 点击父 tag 时筛选整个子树 |
| 子标签筛选 | 点击二级 tag 时筛选完整 path 精确匹配 |
| 展开状态 | 默认只展开当前选中 tag 的父节点 |
| 测试 | 覆盖解析、DTO 映射、树构建、父子筛选和 sidebar 交互 |

### Out of Scope

| 非范围项 | 原因 |
| --- | --- |
| 任意深度 tag 树 | 本轮明确只做二级 |
| 标签重命名、移动、删除 | 属于独立 tag 管理需求 |
| tag 管理页 | 本轮只处理首页输入、展示和筛选 |
| 后端 schema 或数据库改动 | 后端 v0.4 契约已存在，本轮只做 web UI 适配 |
| sync 乱序补偿 | 属于后端同步技术债，不进入 web UI 需求 |

## 验收标准

| 编号 | 标准 |
| --- | --- |
| A1 | 用户创建 note 时输入 `#books/hands-on-gpt`，提交 payload 的 `tags` 包含 `books/hands-on-gpt` |
| A2 | 用户编辑 note 时输入或保留 `#books/hands-on-gpt`，更新 payload 的 `tags` 包含 `books/hands-on-gpt` |
| A3 | 前端能正确消费 `/tags` 返回的 `name`、`parent_tag_id`、`path`、`depth` |
| A4 | sidebar Tags 按二级树展示 root tag 和 child tag |
| A5 | 点击父 tag 会筛选整个子树，点击子 tag 只筛选对应完整 path |
| A6 | 默认只展开当前选中 tag 所在父节点，未选中时不默认展开全部 |
| A7 | note card tag chip 不再把二级 path 原样显示为单段 `books/hands-on-gpt`，而是使用清晰路径表达 |
| A8 | 新增测试不绑定颜色、宽高、间距、Tailwind class 等静态视觉实现细节 |

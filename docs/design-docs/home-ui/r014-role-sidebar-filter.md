# r014-role-sidebar-filter 设计文档

日期：2026-05-30

需求澄清文档：`docs/request-clarify/home-ui/r014-role-sidebar-filter.md`

## 核心功能（WHAT）

在首页 sidebar 增加 `Roles` 分组，并将 role 作为与 `Fields`、`Tags` 平级的筛选维度。默认状态不选择具体 role，展示所有角色创建的 recent notes；用户选择某个 role 后，前端通过 `POST /notes/recent` 携带 `role` 重新加载 note feed，随后 Fields、Tags 和搜索继续在当前 role notes 集合上叠加筛选。

同时在 note card 右上角增加 role badge，用图标和文本展示该 note 的创建角色。`Human` 使用人形图标，其他 role 默认使用 bot 图标。

### 需求背景（WHY）

后端已经在 note 数据中保存 `role`，并在 `POST /notes/recent` 的请求体中提供可选 `role` 过滤能力。当前 Web 首页只支持按 Field、Tag 和关键字浏览，无法区分 Human 与 agent 等不同角色创建的笔记，也没有在 note card 上展示来源角色。用户需要在不增加强制步骤的前提下，快速查看某一类 role 的笔记，并保留现有 Field/Tag 工作流。

### 需求目标（GOAL）

| 目标 | 说明 |
| --- | --- |
| 平级角色导航 | Sidebar 增加 `Roles`，与 `Fields`、`Tags` 同级 |
| 非强制选择 | 默认展示全部 role，用户不需要先选 role 才能使用页面 |
| 服务端 role 筛选 | 选择 role 后由 `POST /notes/recent` 返回对应 role notes |
| Fields/Tags 联动 | Fields 和 Tags 的计数与过滤基于当前 role notes 集合 |
| Card 来源可见 | 每张 note card 右上角展示 role badge |
| 低耦合实现 | UI 层只消费 API Client 和 store 暴露的业务 DTO，不读取数据库契约 |

### 范围边界

| 类型 | 内容 |
| --- | --- |
| In Scope | `NoteDto` 增加 `role` 字段 |
| In Scope | `RecentNotesQuery` 增加 `role` 字段 |
| In Scope | `NotesClient.listRecentNotes()` 请求体支持 `role` |
| In Scope | `useNotesStore` 增加 `selectedRole` 和 role setter |
| In Scope | `loadRecentNotes()` 根据当前 `selectedRole` 拉取 notes |
| In Scope | Sidebar 增加 `Roles` section，默认提供 `全部` |
| In Scope | Role 计数从当前全部 role recent notes 结果中统计 |
| In Scope | Field/Tag 计数继续基于当前 notes 集合计算 |
| In Scope | Note card 右上角增加 role badge 和图标 |
| In Scope | i18n 覆盖 `zh-CN`、`zh-TW`、`en-US` |
| In Scope | 补充 API、store/utils 和 UI 行为测试 |
| Out of Scope | 创建 note 时选择 role |
| Out of Scope | role 权限控制 |
| Out of Scope | role 管理、重命名、隐藏或排序配置 |
| Out of Scope | 后端接口或 schema 修改 |
| Out of Scope | 引入新的 UI 或数据依赖 |

## 实现流程（HOW）

### 后端 API 契约

运行中的 `http://localhost:3000/api-docs/openapi.json` 已确认：

| 接口 | 字段 | 类型 | 设计使用方式 |
| --- | --- | --- | --- |
| `POST /notes/recent` | `limit` | integer/null | 沿用当前 recent feed limit，默认 50 |
| `POST /notes/recent` | `note_uuid` | string/null | 保留现有 cursor 能力 |
| `POST /notes/recent` | `role` | string/null | 选中 role 时传入；未选 role 时不传或传空 |
| `NoteRecord` | `role` | string | 映射到 `NoteDto.role` 并用于 card badge |

本轮不新增接口。Role 列表不来自独立 role endpoint，而是从未选择 role 时加载到的 recent notes 中统计。这样可以保持前端只依赖当前已存在契约。

### 数据模型与 API Client

| 文件 | 改动设计 |
| --- | --- |
| `src/api/types.ts` | `NoteDto` 增加 `role: string`；`RecentNotesQuery` 增加 `role?: string` |
| `src/api/notes.client.ts` | `listRecentNotes()` 在请求体中传递 `role: query.role`；`mapNoteRecordToDto()` 保留 `note.role` |
| `src/api/notes.client.test.ts` | 验证 recent notes 请求体带 role；验证 `NoteDto.role` 映射 |

`role` fallback 策略：

| 场景 | 前端值 |
| --- | --- |
| 后端返回有效字符串 | 使用原始字符串 |
| 后端返回空字符串 | UI 展示 `Unknown`，数据层可保留空字符串或归一为 `Unknown` |
| Mock note | 补齐 `role: "Human"`，保证测试和本地 mock 行为稳定 |

### Store 状态

`useNotesStore` 增加 role 相关状态：

| 状态/动作 | 类型 | 责任 |
| --- | --- | --- |
| `selectedRole` | `string \| undefined` | 当前选中的 role；空表示全部 role |
| `setSelectedRole(role?)` | function | 更新 role 选择并触发 recent notes 重新加载 |
| `loadRecentNotes()` | function | 根据 `selectedRole` 调用 `notesClient.listRecentNotes({ limit: 50, role })` |

`setSelectedRole()` 推荐负责更新状态后立即重新加载 notes，保证用户点击 role 后 feed、Fields 和 Tags 同步变化。现有 `selectedField`、`selectedTag` 不强制清空，继续作为当前 role 集合上的叠加筛选；如果切换 role 后当前 Field/Tag 下没有 note，feed 显示现有空态。

### Sidebar Role 分组

新增 role 计数函数放在 `src/pages/home/homeUtils.ts`：

| 函数 | 责任 |
| --- | --- |
| `countRoles(notes)` | 返回 `Map<string, number>`，统计当前 notes 中各 role 数量 |
| `formatRoleLabel(role)` 或局部 fallback | 为空 role 提供 `Unknown` 文案 |

Sidebar 结构：

```text
Sidebar
├─ Stats / Heatmap
├─ Roles
│  ├─ 全部
│  ├─ Human
│  └─ Agent / other roles
├─ Fields
└─ Tags
```

`Roles` section 使用现有 `SidebarSection` 和 `NavItem`，减少新 UI 形态。Prefix 推荐使用图标而不是文本符号：`Human` 使用 `User`，非 `Human` 使用 `Bot`。如果 `NavItem` 当前只支持字符串 prefix，可以扩展为 `ReactNode`，同时保持 Fields 的 `@` 和 Tags 的 `#` 不受影响。

### Field/Tag 联动

Field/Tag 的设计保持简单：

| 场景 | 行为 |
| --- | --- |
| 未选 role | `notes` 为全部 role recent notes，Fields/Tags 统计所有 role |
| 已选 role | `notes` 为该 role recent notes，Fields/Tags 统计该 role |
| 已选 role + selectedField | feed 在该 role notes 中继续按 field 过滤 |
| 已选 role + selectedTag | feed 在该 role notes 中继续按 tag 过滤 |
| 已选 role + keyword | feed 在该 role notes 中继续按 keyword 过滤 |

这样不需要额外维护 role-filtered 和 field-filtered 两套数据，`notes` 始终代表服务端返回的当前 role 基础集合，`visibleNotes` 继续代表 UI 本地叠加筛选后的展示集合。

### Note Card Role Badge

`NoteCard` 在 metadata/header 右侧增加 role badge：

| Role | 图标 | 文本 |
| --- | --- | --- |
| `Human` | `User` | `Human` |
| 其他字符串 | `Bot` | 原始 role |
| 空字符串 | `Bot` | `Unknown` |

布局策略：

| 约束 | 设计 |
| --- | --- |
| 不挤压时间文本 | header 使用 flex，时间和 badge 分区，badge `shrink-0` |
| 长 role 名称 | badge 文本使用截断或最大宽度，避免撑破 card |
| 多语言 | `Unknown` 走 i18n；后端 role 原文不翻译 |
| 语义 | badge 增加可访问名称，例如 `Role: Human` |

### i18n

语言文件覆盖 `src/i18n/locales/zh-CN/home.ts`、`zh-TW/home.ts`、`en-US/home.ts`。

| Namespace | Key | 占位符 | zh-CN | zh-TW | en-US |
| --- | --- | --- | --- | --- | --- |
| `home` | `sidebar.roles` | 无 | Roles | Roles | Roles |
| `home` | `sidebar.unknownRole` | 无 | Unknown | Unknown | Unknown |
| `home` | `note.roleLabel` | `role` | 创建角色：{{role}} | 建立角色：{{role}} | Role: {{role}} |

后端 role 原始值不做翻译，避免把技术角色名误映射成 UI 文案。

## 测试用例

| 类型 | 验证 |
| --- | --- |
| API 单元测试 | `listRecentNotes({ role: "Agent" })` 请求体包含 `role: "Agent"` |
| API 单元测试 | `mapNoteRecordToDto()` 将 `NoteRecord.role` 映射到 `NoteDto.role` |
| 工具函数测试 | `countRoles()` 正确统计 Human 和非 Human role 数量 |
| Store 测试或 UI 测试 | 点击 role nav 后调用 recent notes role 查询并更新 feed |
| UI 单元测试 | 默认状态显示全部 role notes，且不要求选择 role |
| UI 单元测试 | 选中 role 后 Field/Tag 数量来自当前 role notes |
| UI 单元测试 | `Human` note card 显示人形图标和 `Human` 文本 |
| UI 单元测试 | 非 `Human` note card 显示 bot 图标和原始 role 文本 |
| i18n 测试 | 新增 key 在三种语言资源中完整存在 |
| 编译检查 | `npm run build` 通过 |
| 回归检查 | `npm run test` 通过 |

## 风险控制

- Role 过滤只通过 API Client/store 接入，不让 UI 组件拼接后端路径或读取数据库结构。
- 不新增依赖，图标沿用现有 `lucide-react`。
- 不把 role 设为必选状态，默认 `selectedRole` 为空。
- Role 与 Field/Tag 组合只做当前集合内叠加过滤，不引入复杂查询状态。
- 测试验证用户可观察行为和 API payload，不绑定静态 Tailwind class 或固定视觉数值。

# r016-settings-modal-compact-ui-redesign 设计文档

日期：2026-05-30

需求澄清文档：`docs/request-clarify/sync/r016-settings-modal-compact-ui-redesign.md`

## 核心功能（WHAT）

对 SettingsModal 中的 Supabase 配置区块进行**纯视觉与布局紧凑化重构**，将现有“单一大容器 + 内部表格行”的陈旧形态，改造为两个语义分组的极致紧凑白色卡片 + 右对齐单线下划线输入的现代设置面板风格，同时严格保持所有功能行为不变。

### 需求背景（WHY）

r015 已将 Supabase 配置迁移至全局 Settings 弹窗内作为独立 section。但当前实现（SupabaseSettingsSection 中的 `bg-[var(--color-surface-muted)]` 容器 + FieldLabel/SettingRow 网格 + 底边框）在视觉上呈现出强烈的传统数据库配置面板气质，与 App 整体“干净白卡片 + 极细边框 + 柔和 teal 强调”的设计语言严重不符。

用户提供截图后明确指出“非常丑陋”，并经过多轮澄清锁定以下硬性约束：
- 极致紧凑（禁止增加任何行高、留白）
- 收窄模态宽度
- 输入仅用一条细线表达
- 所有 value 右对齐
- 两张卡片之间保留 4px

### 设计目标（GOAL）

| 目标 | 设计结论 |
|------|----------|
| 视觉形态 | 两个独立、极致紧凑的白色卡片（连接信息 + 同步设置） |
| 整体宽度 | 模态最大宽度收窄至 480px，内容更聚焦 |
| 输入表达 | 仅使用 1px 底部细线，无边框、无背景；focus 时切换 accent 强色 |
| 对齐规则 | 所有输入 value（文字、数字、开关）必须右对齐 |
| 紧凑标准 | 行垂直 padding 控制在 5-6px，卡片内 padding 极小，Label 列宽约 110px |
| 卡片间距 | 两卡片之间精确保留 4px 间隙 |
| 配色 | 100% 复用现有 CSS 变量，绝不引入新颜色 |
| 功能 | 保存、测试、启用切换、加载逻辑完全不变 |

### 范围边界

| In Scope | Out of Scope |
|----------|--------------|
| SettingsModal 宽度与内边距调整 | 不改动任何业务逻辑与 API 调用 |
| 两个紧凑卡片的分组容器实现 | 不新增/删除配置字段 |
| 输入控件“单线下划线 + 右对齐”呈现 | 不改动 i18n 文案 |
| Toggle、ActionButton 的紧凑化视觉处理 | 不引入新依赖或组件库 |
| 移除原表格容器与 FieldLabel/SettingRow 旧模式 | 不做完整多 section 设置体系扩展 |
| 保证暗色模式通过 CSS 变量自动适配 | 不单独编写暗色专项样式 |
| 单元测试与手工视觉验收 | 不处理其他未来可能出现的设置区块 |

## 实现方案设计（HOW）

### 整体布局结构

SettingsModal 保持居中弹窗，内部仅保留 Supabase 一个 section。

新的视觉层级：

```
Settings Modal (max-w-[480px], rounded-[12px])
├─ Header（紧凑：标题 + 关闭按钮）
├─ Section Title: Supabase（极小 muted 文字）
└─ 内容区（极小 gap）
   ├─ 卡片1: 连接信息（白色、极紧凑 padding）
   │   ├─ 小标题
   │   ├─ Supabase URL 行（label 左 + value 右 + 单线下划线）
   │   └─ Secret key 行（label 左 + masked value 右 + 单线下划线 + 极小 help text）
   │
   ├─ 4px 间隙
   │
   ├─ 卡片2: 同步设置（白色、极紧凑 padding）
   │   ├─ 小标题
   │   ├─ 同步间隔秒数 行（label 左 + 数字 右 + 单线下划线）
   │   └─ 启用同步 行（label 左 + 紧凑 Toggle 右对齐）
   │
   └─ 底部操作区（极紧右对齐）
       └─ Test / Save 按钮（低调 icon+文字，紧贴内容）
```

### 精确尺寸与布局规格

所有尺寸均以“在中文完整显示前提下尽量压紧”为原则。

| 项目 | 规格 | 说明 |
|------|------|------|
| Modal 最大宽度 | 480px | 显著收窄，桌面下更聚焦 |
| Modal 圆角 | 12px | 比当前 16px 略紧 |
| Modal 水平 padding | 16px (px-4) | 更紧 |
| 两卡片之间间隙 | 4px | 精确保留 |
| 卡片背景 | --color-surface (纯白) | 轻微阴影或极细边框可选 |
| 卡片圆角 | 8-10px | 与整体协调 |
| 卡片内 padding | px-3 py-2 | 极致紧凑 |
| 行垂直 padding | py-[5px] ~ py-[6px] | 强烈紧凑，禁止更大 |
| Label 列固定宽度 | 110px | 保证“同步间隔秒数”完整不换行 |
| Label 字号/字重 | text-sm (14px) / semibold | 保持可读 |
| Value 字号 | text-sm (14px) | 右对齐 |
| 输入下划线 | 1px border-b，默认 --color-border，focus 时 --color-border-strong | 唯一视觉表达 |
| Help text（secret） | text-[11px] / text-muted | 紧贴下划线下方，无额外大间距 |
| Toggle 尺寸 | 高度约 20-22px，宽度约 36-38px | 比当前更小更紧凑 |
| 底部按钮间距 | gap-1.5 ~ gap-2 | 紧凑右对齐 |
| Section Title 字号 | text-xs ~ text-[13px] | 非常低调 |

### 输入控件设计规范

**核心原则**：输入框不再是“盒子”，而是“可编辑的带下划线的文本”。

- 所有输入（text、password、number）统一使用：
  - `bg-transparent`
  - `text-right`
  - `border-b border-[var(--color-border)]`
  - focus 状态切换为 `border-[var(--color-border-strong)]`
  - 无 `rounded`、无 `shadow`、无 `px` 背景填充
- Placeholder 使用 muted 色，focus 后可淡出或保留
- Secret key 输入仍为 password 类型，留空语义不变

### 组件重构策略

| 原组件/结构 | 新处理方式 | 改动程度 |
|-------------|------------|----------|
| 外层 `bg-[var(--color-surface-muted)]` + 圆角容器 | 删除，替换为两个独立的白色卡片 div | 大 |
| FieldLabel（grid 150px + border-b） | 重构或废弃，改用更简单的紧凑行结构（可保留 grid 但列宽 110px + 取消外容器边框） | 大 |
| SettingRow（同上） | 与 FieldLabel 合并为统一的紧凑行渲染逻辑 | 大 |
| 输入框 class | 统一收敛到新的 “underline-input” 视觉规则 | 中 |
| 自定义 Toggle | 保持现有 peer 实现，仅缩小尺寸、优化颜色使用变量 | 小 |
| ActionButton | 保持逻辑，仅收紧 padding / gap，使其更贴合紧凑整体 | 小 |
| Alert（error/success） | 保持现有，位置放在两卡片上方或之间，间距压紧 | 小 |

**推荐实现方式**（设计层面）：
- 在 SupabaseSettingsSection 内部新建两个极简的 `CompactCard` 容器组件（或直接用 div + 语义 class）。
- 提取 `CompactFieldRow` 统一处理 label + 右对齐下划线输入。
- 所有尺寸、颜色严格走 CSS 变量，禁止硬编码。

### 视觉层次与信息分组

- “连接信息”卡片：承载 URL + Secret（高敏感度配置，视觉上更独立）
- “同步设置”卡片：承载 Interval + Enable（行为控制）
- 两卡片之间 4px 间隙 + 各自的小标题，形成清晰的“两个功能群组”感知，而非单一长列表。
- Section 标题 “Supabase” 保持极低调（text-muted），不抢卡片视觉焦点。

### 响应式与可访问性

- 480px 宽度在桌面已足够紧凑，移动端可进一步收窄至 92vw。
- 所有输入必须保留真实 `<input>`，保证键盘、屏幕阅读器可用。
- Toggle 继续使用 `<input type="checkbox" role="switch">` + 视觉伪元素。
- Focus 状态必须清晰（下划线颜色变化 + 可能的 outline-offset）。
- 暗色模式自动继承现有变量，无需额外处理。

### 错误与反馈呈现

保持 r015 已确立的局部反馈机制：
- Test / Save 结果在卡片区域上方以紧凑 Alert 形式展示。
- 校验错误（interval）直接在对应行下方或通过 Alert 呈现。
- 所有反馈文字与间距也要遵循紧凑原则。

## 风险与约束

- 极致压紧可能导致部分用户觉得“太挤”——需通过本次验收时的手工检查确认平衡点。
- 中文最长标签“同步间隔秒数”决定了 Label 列最小宽度（110px），不可再压。
- 现有测试（SettingsModal.test.tsx、SupabaseSettingsSection.test.tsx）中可能存在基于旧表格结构的快照或查询，需要同步更新。
- 必须保证重构后 `handleSave`、`handleTestConnection`、`handleSyncEnabledChange` 等逻辑零改动。

## 后续执行要点

1. 先在设计稿 / 示意图层面与用户最终确认紧凑程度（已在澄清阶段完成）。
2. 编码时严格遵守“前端组件模块化纪律”：将新布局逻辑拆分为可复用的紧凑行/卡片组件，避免继续堆在 SupabaseSettingsSection.tsx 中。
3. 每完成一个视觉 Stage 必须进行一次 git commit。
4. 最终手工验收必须在真实桌面 + 移动端 + 暗色模式下检查紧凑效果与中文显示。

---

**本设计文档仅描述方案与约束，不包含可直接运行的代码实现。**
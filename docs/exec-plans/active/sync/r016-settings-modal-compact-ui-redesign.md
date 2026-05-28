# r016-settings-modal-compact-ui-redesign 执行计划

日期：2026-05-30

需求澄清文档：`docs/request-clarify/sync/r016-settings-modal-compact-ui-redesign.md`

设计文档：`docs/design-docs/sync/r016-settings-modal-compact-ui-redesign.md`

## 目标

将 SettingsModal 中的 Supabase 配置区块从“单一大容器 + 内部表格行”的陈旧形态，重构为两个极致紧凑的白色语义卡片 + 右对齐单线下划线输入的现代紧凑设置面板。整体模态宽度收窄，所有间距在中文可读前提下压至最低，同时**功能行为、API 调用、状态管理零改动**。

## 架构与边界

- 仅重构 `src/pages/settings/SettingsModal.tsx` 和 `src/pages/settings/SupabaseSettingsSection.tsx` 的视觉布局层。
- 保留现有 `syncClient`、`useState`、`handleSave`、`handleTestConnection`、`handleSyncEnabledChange` 等全部业务逻辑。
- 新增/重构的紧凑布局组件严格放在 `src/pages/settings/` 目录下，命名清晰（例如 `CompactSettingsCard.tsx`、`CompactFieldRow.tsx`）。
- 所有尺寸、颜色、边框必须通过现有 CSS 变量实现，禁止硬编码新颜色。
- 测试以行为验证为主，禁止编写绑定具体 Tailwind 类名或像素值的 UI 快照测试。
- 每完成一个 Stage 必须执行一次 git commit，提交信息符合 Conventional Commits 规范。

## Stage 1：组件边界治理与紧凑基础组件提取

状态：Designed

### Task 1.1：分析并标记当前布局耦合点

状态：Designed

功能：梳理 SupabaseSettingsSection 中所有与“表格容器 + 网格行”强相关的代码，为后续安全拆分做准备。

实现要点：
- 阅读并标注 `FieldLabel` 和 `SettingRow` 两个本地组件的完整职责。
- 确认当前输入框、Toggle、ActionButton 的 class 分布。
- 识别所有直接依赖 `bg-[var(--color-surface-muted)]` + `border-b border-[var(--color-border-subtle)]` 的布局代码。
- 记录哪些状态和事件处理与布局完全无关（这些必须在重构中保持 100% 不动）。

预期测试：
- 无需新增测试，仅阅读与标注。

### Task 1.2：提取 CompactFieldRow 基础组件

状态：Designed

功能：设计并实现一个新的、极简的紧凑字段行渲染组件，服务于后续两个卡片。

实现要点：
- 在 `src/pages/settings/` 下新建 `CompactFieldRow.tsx`（或直接在 SupabaseSettingsSection 内先以私有方式验证）。
- 该组件接收 `label`、`children`（右对齐的内容区）、可选 `helpText`。
- 内部使用 `grid-cols-[110px_minmax(0,1fr)]` 或等效 flex 实现，严格遵循设计文档中的 110px Label 列宽 + py-[5px] 左右的紧凑垂直节奏。
- 必须提供完整的 JSDoc 文档字符串，说明 props、用途、布局约束。
- 暂时不处理“单线下划线”，仅实现紧凑的 label + 内容区对齐结构。

预期测试：
- 在 `SupabaseSettingsSection.test.tsx` 中增加针对新组件的基础渲染测试（验证 label 完整显示、children 右对齐）。
- 运行 `npm run test -- src/pages/settings/SupabaseSettingsSection.test.tsx`

完成 Stage 1 后验证：
- 代码可编译，现有测试通过。
- 无任何功能行为变化。
- 提交信息示例：`refactor: extract compact field row foundation for settings redesign`

## Stage 2：两个紧凑卡片容器实现 + 布局替换

状态：Designed

### Task 2.1：实现两个语义卡片容器

状态：Designed

功能：创建 `CompactSettingsCard` 组件，承载“连接信息”和“同步设置”两个分组。

实现要点：
- 新建或在 section 内实现两个卡片容器，背景为 `--color-surface`，内部 padding 严格控制在设计文档规定的极紧凑值。
- 卡片内部放置小标题 + 多个 `CompactFieldRow`。
- 两卡片之间硬编码 4px 间隙（或用 Tailwind `gap-1` 配合父容器）。
- 卡片本身可使用极细的 `--color-border-subtle` 边框或仅靠白色背景 + 轻微阴影区分（需在视觉验收时最终确认）。

预期测试：
- 手动渲染验证两个卡片独立存在且间距正确。
- 单元测试验证卡片标题正确渲染。

### Task 2.2：把原有字段迁移到新卡片结构

状态：Designed

功能：将 URL、Secret key、Interval、Enable sync 四个字段逐步迁移到两个新卡片中，移除旧的单一 muted 容器。

实现要点：
- 删除或注释掉原 `overflow-hidden rounded-[16px] bg-[var(--color-surface-muted)]` 外层容器。
- 使用新卡片 + CompactFieldRow 重建四个字段的布局。
- 保持所有 `useState`、`handle*` 函数、校验逻辑完全不变。
- 确保“同步设置”卡片内的两个 value 仍然严格右对齐。

预期测试：
- 运行现有 `SupabaseSettingsSection.test.tsx`，确保加载、保存、测试、切换 enabled 的行为 100% 一致。
- 编译通过。

完成 Stage 2 后验证：
- `npm run test -- src/pages/settings/`
- `npm run build`
- 提交：`feat: introduce two compact cards layout for supabase settings`

## Stage 3：输入控件“单线下划线”视觉实现 + 全局紧凑化收尾

状态：Designed

### Task 3.1：实现输入框仅下划线视觉规则

状态：Designed

功能：将所有输入（Supabase URL、Secret key、Interval）改造为“右对齐 + 仅底部 1px 细线”的表达方式。

实现要点：
- 定义统一的输入视觉规则（可提取为工具类或局部样式）。
- 移除原有输入框上可能存在的 `rounded`、`bg-transparent focus:bg-surface` 等旧规则。
- 实现 focus 状态下下划线颜色从 `--color-border` 切换到 `--color-border-strong`。
- Secret key 继续使用 `type="password"`，placeholder 保持原有文案。
- 确保在中文环境下 value 右对齐且不溢出卡片。

预期测试：
- 手工检查 focus 时的下划线颜色变化。
- 单元测试中验证输入仍可正常输入、受控。

### Task 3.2：Toggle 与 ActionButton 紧凑化

状态：Designed

功能：将 Toggle 和底部两个按钮的视觉尺寸与间距压紧，使其匹配整体“极致紧凑”要求。

实现要点：
- Toggle：缩小 track 与 thumb 尺寸，保持现有可访问性实现。
- ActionButton：收紧 padding、gap、字体大小，保持 hover 行为。
- 确保按钮在窄模态（480px）下不会换行或溢出。

预期测试：
- 视觉手工验收（桌面 + 移动端）。
- 无功能回归。

### Task 3.3：移除旧表格相关代码与样式

状态：Designed

功能：彻底清理不再使用的 FieldLabel、SettingRow 旧实现，以及所有与之相关的 border / muted 背景代码。

实现要点：
- 删除或完全废弃旧的 FieldLabel / SettingRow 函数。
- 清理不再引用的 class（`border-b border-[var(--color-border-subtle)]` 等）。
- 确认没有残留的旧容器样式。
- 更新组件内部注释，说明新结构。

预期测试：
- 全量测试通过 + 构建通过。
- 代码无死代码警告。

完成 Stage 3 后验证：
- `npm run test -- src/pages/settings/`
- `npm run build`
- 提交：`style: apply underline-only right-aligned inputs and tighten all spacing`

## Stage 4：测试完善、构建验证与用户验收

状态：Designed

### Task 4.1：完善测试覆盖与快照清理

状态：Designed

功能：确保重构后的组件仍有足够测试保护，且不遗留对旧结构的依赖。

实现要点：
- 检查并更新 SettingsModal.test.tsx 和 SupabaseSettingsSection.test.tsx 中可能失效的查询或断言。
- 禁止新增任何绑定具体 class 名或固定像素的视觉测试。
- 增加少量针对 CompactFieldRow / 卡片结构的渲染正确性测试。

预期测试：
- 全套 settings 相关测试 100% 通过。

### Task 4.2：完整构建 + 跨主题验证

状态：Designed

功能：验证浅色/暗色模式下视觉一致性。

实现要点：
- `npm run build`
- 手动在浏览器中切换主题，检查下划线颜色、卡片对比度、文字可读性。
- 在 480px 宽度附近检查中文是否完整显示、无截断。

### Task 4.3：用户手工视觉验收

状态：Designed

功能：邀请用户按设计文档中的验收标准逐条检查。

实现要点：
- 提供本地运行命令。
- 重点检查：模态宽度、4px 卡片间距、单线下划线、所有 value 右对齐、极致紧凑感、中文显示、暗色模式。
- 根据反馈进行最后一轮微调（若有）。

完成 Stage 4 后验证：
- 所有测试 + 构建通过。
- 用户书面确认视觉效果符合预期。
- 提交：`test: finalize compact settings modal visual regression protection`

## Stage 5：文档归档与收尾

状态：Designed

### Task 5.1：移动执行计划到 completed 目录

状态：Designed

功能：按规范将已验收的执行计划归档，并更新 PROGRESS.md。

实现要点：
- 用户确认验收后，将 `r016-...md` 从 `active/sync/` 移至 `completed/sync/`。
- 在 `docs/PROGRESS.md` 的“项目流程记录”章节追加本次重构的简要记录（不超过 200 字）。
- 更新 `docs/exec-plans/tech-debt-tracker.md`（如有遗留）。

预期结果：
- 文档系统干净，当前进行中工作清晰。

完成 Stage 5 后最终提交：
- `docs: archive r016 compact settings ui redesign execution plan`

---

**重要约束（全流程必须遵守）**

- 任何时候都禁止修改业务逻辑。
- 每 Stage 完成后必须 git commit。
- UI 相关改动必须先通过设计文档中的示意图规格与用户确认（本次已在澄清阶段完成）。
- 所有新增函数必须有完整文档字符串，所有成员变量必须有注释。

**当前状态**：全部 Stage 均为 Designed，等待用户对本执行计划的最终审核确认后即可启动 Stage 1 编码。
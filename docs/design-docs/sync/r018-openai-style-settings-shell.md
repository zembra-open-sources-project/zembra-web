# r018-openai-style-settings-shell 设计文档

日期：2026-05-28

需求澄清文档：`docs/request-clarify/sync/r018-openai-style-settings-shell.md`

## 核心功能（WHAT）

将当前单栏 Settings modal 重构为 OpenAI 风格的单 surface 设置中心。新的设置中心由一个可复用 settings shell 承载，左侧或窄屏顶部展示真实注册分类，右侧展示当前分类内容。当前只注册真实存在的 `Sync` 分类，并接入现有 Supabase 同步配置功能。

### 需求背景（WHY）

当前设置弹窗仍以单栏 Supabase 配置为中心，历史 r016 的紧凑卡片方案已经不符合新的目标。新目标强调 OpenAI 设置页的空间模型和视觉语法：一个完整 modal surface、内部平面分区、左侧分类导航、右侧标题与分割线设置行。实现时必须避免把 sidebar、content 或设置分组做成嵌套卡片，否则会偏离参考样式并重新产生“框中框”的笨重视觉。

### 需求目标（GOAL）

| 目标 | 设计结论 |
| --- | --- |
| 设置壳层 | 提供单 surface 的双栏 settings shell。 |
| 分类来源 | 使用 settings 模块内静态注册表，只注册真实分类。 |
| 当前分类 | 分类名称为 `Sync`。 |
| 当前内容 | 将现有 Supabase 同步配置作为 `Sync` 分类内容。 |
| 窄屏适配 | 窄屏下分类导航从左侧栏变为顶部横向分类栏。 |
| 控件语义 | URL、Secret key、Interval seconds 保持输入框；Enable sync 保持 switch；Test / Save 保持按钮。 |
| 业务逻辑 | 读取、测试、保存、启用同步等 API 调用和状态逻辑保持不变。 |

### 范围边界

| In Scope | Out of Scope |
| --- | --- |
| `SettingsModal` 重构为 settings shell 容器 | 不新增 mock 分类或空分类 |
| settings 模块内静态分类注册表 | 不引入 context/provider 动态注册机制 |
| `Sync` 分类接入现有 Supabase 配置 | 不修改后端 `/sync/*` API 契约 |
| OpenAI 风格平面设置行布局 | 不使用 r016 的双卡片结构 |
| 响应式分类导航 | 不把输入控件改成箭头二级详情页 |
| i18n 补齐 `Sync` 分类文案 | 不新增 UI 组件库或依赖 |

## 实现流程（HOW）

### 组件结构

`SettingsModule` 继续负责入口按钮和打开状态。`SettingsModal` 负责遮罩、关闭行为和 settings shell。分类注册表放在 settings 模块内，静态声明当前真实分类。

```text
src/pages/settings/
├─ SettingsModule.tsx
├─ SettingsModal.tsx
├─ settingsRegistry.ts
└─ SupabaseSettingsSection.tsx
```

组件关系：

```text
SettingsModule
└─ SettingsModal
   ├─ settingsRegistry: Sync
   ├─ SettingsNav
   └─ activeCategory.renderContent()
      └─ SupabaseSettingsSection
```

### 静态注册表

注册表只承担本模块内的分类声明，不做插件系统。

| 字段 | 用途 |
| --- | --- |
| `id` | 分类稳定标识，当前为 `sync`。 |
| `labelKey` | i18n 文案 key，当前指向 `settings.categories.sync`。 |
| `icon` | 左侧导航图标组件，优先使用已有 `lucide-react` 图标。 |
| `renderContent` | 渲染分类内容，当前返回 `SupabaseSettingsSection`。 |

`SettingsModal` 持有 `activeCategoryId`，默认选中注册表第一个分类。注册表为空不是当前产品状态；实现可以在类型和渲染层保持防御，但不得为了视觉新增占位分类。

### UI 布局结构

设置弹窗只有一个可见 surface：

```text
Modal surface
├─ Sidebar / narrow top nav
│  ├─ Close button
│  └─ Category nav items
└─ Content
   ├─ Active category title
   ├─ Divider
   └─ Active category content
```

布局约束：

| 层级 | 职责 |
| --- | --- |
| Overlay | 负责遮罩、居中和点击遮罩关闭。 |
| Modal surface | 负责唯一背景、圆角、边框、阴影、最大宽高和 overflow。 |
| Sidebar | 负责关闭按钮和分类导航节奏，不提供独立边框或卡片背景。 |
| Content | 负责标题、分割线和当前分类内容宽度，不提供独立边框或卡片背景。 |
| Settings rows | 负责 label、帮助文本、右侧控件和行分割线。 |

桌面布局使用双栏 grid：左侧固定宽度，右侧自适应。窄屏布局切换为单列：顶部第一行保留关闭按钮，分类导航变为横向滚动或换行的顶部分类栏，内容区在下方完整展示。

### Sync 分类内容

`SupabaseSettingsSection` 保留现有状态和 API 逻辑，但视觉结构从紧凑卡片调整为平面设置行。

| 设置项 | 控件 | 行为 |
| --- | --- | --- |
| Supabase URL | 文本输入框 | 编辑候选 URL，Save 时保存。 |
| Secret key | 密码输入框 | 留空保留现有 secret。 |
| Interval seconds | 数字输入框 | 保持非负整数校验。 |
| Enable sync | switch | 切换时立即持久化，失败回滚。 |
| Test | 按钮 | 调用 `testConfig`，不保存。 |
| Save | 按钮 | 调用 `updateConfig`，不手动同步。 |

内容区可以保留加载、错误、成功和测试结果反馈，但反馈同样放在右侧内容流里，不包成额外设置卡片。错误/成功提示可使用轻量提示条，提示条不是设置分组容器。

### 状态归属

| 状态 | 归属 |
| --- | --- |
| modal open/close | `SettingsModule` |
| active category | `SettingsModal` |
| Sync config form | `SupabaseSettingsSection` |
| loading/saving/testing/toggling | `SupabaseSettingsSection` |
| error/success/test result | `SupabaseSettingsSection` |

### 布局纪律

- 不在 modal surface 内新增可见外框、嵌套卡片或内容面板。
- 不用空分类、mock 分类或占位分类撑视觉。
- 不因当前只有一个分类而移除导航区。
- 不使用固定视口魔法数；宽度来自 modal 最大宽度、sidebar 固定列和 content 自适应列。
- 输入框必须是设置行右侧真实控件，不能改成二级箭头行。
- 文案需要检查英文、简体中文、繁体中文长度，避免窄屏按钮或标签重叠。

## i18n

新增或调整 settings namespace 文案：

| Key | en-US | zh-CN | zh-TW |
| --- | --- | --- | --- |
| `settings.categories.sync` | Sync | 同步 | 同步 |

现有文案继续沿用：

| Key | 用途 |
| --- | --- |
| `settings.title` | modal 可访问名称。 |
| `settings.close` | 关闭按钮和遮罩可访问名称。 |
| `settings.supabase.*` | Sync 分类内的真实配置字段。 |
| `settings.actions.test` / `settings.actions.save` | 分类内容动作按钮。 |

## 测试用例

### 编译检查

| 用例 | 预期 |
| --- | --- |
| `npm run build` | TypeScript 与 Vite 构建通过。 |

### 单元测试

| 用例 | 预期 |
| --- | --- |
| Settings modal 渲染 | `role="dialog"` 名称仍为 Settings，能看到 `Sync` 分类导航。 |
| 分类内容挂载 | 默认选中 `Sync`，能看到 Supabase URL、Secret key、Interval seconds、Enable sync。 |
| 关闭行为 | 关闭按钮和遮罩仍调用 `onClose`。 |
| Sync 配置加载 | 表单加载后展示后端配置值。 |
| Test action | 调用 `testConfig`，不调用保存或手动同步。 |
| Save action | 调用 `updateConfig`，不调用手动同步。 |
| Enable sync | 切换时持久化，失败时回滚。 |
| i18n 资源 | 三种语言包含 `settings.categories.sync`。 |

### 手工检查

| 用例 | 预期 |
| --- | --- |
| 桌面视觉 | 只有一个 modal surface，无 sidebar/content 外框，无嵌套卡片。 |
| OpenAI 风格 | 左侧分类导航、右侧标题、分割线设置行形成平面设置中心。 |
| 窄屏视觉 | 分类导航切换为顶部横向分类栏，输入框和按钮不重叠、不被截断。 |
| 主题检查 | 浅色和暗色模式都复用现有 CSS 变量，视觉自然。 |

### 回归检查

| 用例 | 预期 |
| --- | --- |
| 首页 Settings 入口 | 点击首页设置按钮仍打开弹窗。 |
| 首页其他功能 | 笔记列表、编辑器、手动同步入口不受影响。 |
| API Client | 不修改 sync client 契约和 DTO 映射。 |


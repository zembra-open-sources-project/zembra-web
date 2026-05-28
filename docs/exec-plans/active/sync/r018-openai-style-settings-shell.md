# r018-openai-style-settings-shell 实现计划

> **给 Claude：** 必需工作流：使用 superpowers:executing-plans 逐任务实现此计划。

**目标：** 将当前设置弹窗重构为 OpenAI 风格单 surface settings shell，并通过静态注册表接入真实 `Sync` 分类。

**相关设计文档：** `docs/design-docs/sync/r018-openai-style-settings-shell.md`

**相关需求澄清文档：** `docs/request-clarify/sync/r018-openai-style-settings-shell.md`

**架构：** `SettingsModule` 继续管理入口和打开状态；`SettingsModal` 承载唯一 modal surface、分类导航和当前分类内容；settings 模块内新增静态注册表，只注册真实 `Sync` 分类；`SupabaseSettingsSection` 保留业务逻辑并改为平面设置行视觉。

**技术栈：** Vite + React + TypeScript + Tailwind CSS v4 + react-i18next + lucide-react。

**范围 / 非范围：** 本计划只覆盖 settings shell、静态分类注册、`Sync` 分类接入、响应式布局和相关测试；不新增 mock 分类、不改后端 API、不引入新依赖、不实现 provider 动态注册、不把输入项改成二级箭头页。

---

## 关联设计文档

- `docs/design-docs/sync/r018-openai-style-settings-shell.md`

## Stage #1: Settings Shell 与静态注册表

### 任务 #1: 新增 settings 静态注册表

**Status:** Finished

**Files:**
- Create: `src/pages/settings/settingsRegistry.tsx`
- Modify: `src/i18n/locales/en-US/settings.ts`
- Modify: `src/i18n/locales/zh-CN/settings.ts`
- Modify: `src/i18n/locales/zh-TW/settings.ts`
- Verify: `src/i18n/resources.test.ts`

- 功能：定义 settings 模块内静态分类注册表，当前只注册真实 `Sync` 分类。
- 实现说明：注册项包含 `id`、`labelKey`、`icon`、`renderContent`；`renderContent` 接收 `client?: SyncClient` 并返回 `SupabaseSettingsSection`。新增 `settings.categories.sync` 三语言文案。
- 预期验证结果：i18n 资源测试可读取新增 key；注册表没有空分类或 mock 分类。
- 完成记录：已创建 settings 模块内静态注册表，仅注册真实 `Sync` 分类；已补齐 en-US、zh-CN、zh-TW 的 `settings.categories.sync` 文案。

### 任务 #2: 重构 SettingsModal 为单 surface shell

**Status:** Finished

**Files:**
- Modify: `src/pages/settings/SettingsModal.tsx`
- Modify: `src/pages/settings/SettingsModal.test.tsx`

- 功能：将当前单栏 modal 改为 OpenAI 风格 settings shell，保留唯一可见 modal surface。
- 实现说明：`SettingsModal` 内部持有 `activeCategoryId`，默认选中注册表第一项；桌面使用双栏 grid，左侧包含关闭按钮和分类导航，右侧包含当前分类标题、分割线和 `renderContent`。窄屏下切换为顶部横向分类栏。禁止新增 sidebar/content 可见外框、嵌套卡片或 mock 分类。
- 预期验证结果：测试能找到 `role="dialog"`、`Sync` 分类按钮、默认 Sync 内容和关闭行为；DOM 语义不依赖静态样式类断言。
- 完成记录：已将 `SettingsModal` 改为单 surface settings shell，桌面双栏、窄屏顶部分类栏；当前默认挂载 `Sync` 分类和现有 Supabase 设置内容。

## Stage #2: Sync 分类内容平面设置行

### 任务 #3: 将 SupabaseSettingsSection 改为 OpenAI 风格设置行

**Status:** Finished

**Files:**
- Modify: `src/pages/settings/SupabaseSettingsSection.tsx`
- Optionally Delete/Stop using: `src/pages/settings/CompactSettingsCard.tsx`
- Optionally Delete/Stop using: `src/pages/settings/CompactFieldRow.tsx`
- Modify: `src/pages/settings/SupabaseSettingsSection.test.tsx`

- 功能：保留现有 Supabase/Sync 业务逻辑，将视觉结构从 r016 紧凑卡片改为平面设置行。
- 实现说明：移除“双卡片”布局；设置项按行展示，左侧为 label/help/error，右侧为真实输入框或 switch；行之间使用水平分割线。URL、Secret key、Interval seconds 继续是输入框，Enable sync 继续是 switch，Test/Save 放在内容流底部右侧。保留 `getConfig`、`updateConfig`、`testConfig`、enabled 切换失败回滚、interval 校验等逻辑。
- 预期验证结果：现有行为测试继续通过；测试不新增颜色、间距、固定尺寸、Tailwind class 等静态视觉断言。
- 完成记录：已将 Supabase 设置内容改为平面设置行，保留 URL、Secret key、Interval seconds 输入框和 Enable sync switch，业务逻辑未改。

### 任务 #4: 清理 r016 旧组件依赖

**Status:** Finished

**Files:**
- Modify/Delete: `src/pages/settings/CompactSettingsCard.tsx`
- Modify/Delete: `src/pages/settings/CompactFieldRow.tsx`
- Verify: `rg -n "CompactSettingsCard|CompactFieldRow" src/pages/settings`

- 功能：移除或停止使用 r016 双卡片布局组件，避免后续误用旧视觉方向。
- 实现说明：如果两个组件不再被引用，删除文件；如果保留有短期必要，必须确认 SettingsModal 和 SupabaseSettingsSection 不再引用它们。
- 预期验证结果：`rg` 检查确认旧卡片组件没有被当前 settings 实现引用；TypeScript 构建通过。
- 完成记录：已删除 `CompactSettingsCard.tsx` 和 `CompactFieldRow.tsx`，当前 settings 实现不再引用 r016 卡片组件。

## Stage #3: 验证与计划回写

### 任务 #5: 定向测试与构建验证

**Status:** Finished

**Files:**
- Verify: `src/pages/settings/SettingsModal.test.tsx`
- Verify: `src/pages/settings/SupabaseSettingsSection.test.tsx`
- Verify: `src/pages/home/HomePage.test.tsx`
- Verify: `src/i18n/resources.test.ts`
- Verify: `package.json`

- 功能：验证 settings shell、Sync 分类内容、首页入口和 i18n 回归。
- 实现说明：运行 `npm run test -- src/pages/settings/SettingsModal.test.tsx src/pages/settings/SupabaseSettingsSection.test.tsx src/pages/home/HomePage.test.tsx src/i18n/resources.test.ts`，再运行 `npm run build`。
- 预期验证结果：定向测试全部通过；生产构建通过。
- 完成记录：`npm run test -- src/pages/settings/SettingsModal.test.tsx src/pages/settings/SupabaseSettingsSection.test.tsx src/pages/home/HomePage.test.tsx src/i18n/resources.test.ts` 已通过，4 个测试文件、20 个测试；`npm run build` 已通过。

### 任务 #6: 手工视觉检查与计划状态回写

**Status:** Finished

**Files:**
- Modify: `docs/exec-plans/active/sync/r018-openai-style-settings-shell.md`
- Verify: local browser preview

- 功能：确认实际 UI 没有偏离已确认布局，并记录完成过程。
- 实现说明：启动本地前端后检查桌面和窄屏：只有一个 modal surface；左侧或顶部导航不是卡片；右侧内容不是卡片；输入框仍是真实输入控件；无 mock 分类；浅色/暗色模式自然。完成后按实际执行情况更新本计划任务状态和完成记录。
- 预期验证结果：视觉检查通过，计划记录包含验证命令和结果。完成每个 Stage 后按项目规则进行一次原子 git commit，commit message 必须符合 AGENTS.md 中 Conventional Commits 白名单。
- 完成记录：已启动 Vite dev server，并通过 Chrome headless + DevTools Protocol 打开 `http://127.0.0.1:5174/`、点击设置入口，完成桌面和窄屏截图检查。桌面截图确认单一 modal surface、左侧仅 `Sync` nav item 高亮、右侧为标题和分割线设置行；窄屏截图确认分类导航切换为顶部横向区域，输入框和按钮无重叠。截图保存到 `/private/tmp/zembra-r018-desktop.png` 和 `/private/tmp/zembra-r018-mobile.png`。

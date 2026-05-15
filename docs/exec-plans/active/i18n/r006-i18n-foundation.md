# r006-i18n-foundation

日期：2026-05-15

## Related Request Clarify

- `docs/request-clarify/i18n/r006-i18n-foundation.md`

## Related Design Doc

- `docs/design-docs/i18n/r006-i18n-foundation.md`

## Stage #1: i18n 基础设施

### Task #1: 新增 i18next 依赖与初始化模块

**Status:** Finished

**Files:** Modify `package.json`, `package-lock.json`; Create `src/i18n/index.ts`, `src/i18n/resources.ts`, `src/i18n/types.ts`, `src/i18n/locale.ts`

**Function:** 建立 `i18next + react-i18next` 初始化、语言类型、语言资源聚合和偏好处理能力。

**Implementation Notes:**

- 新增生产依赖 `i18next`、`react-i18next`。
- 定义 `SupportedLocale`、`defaultLocale`、`fallbackLocale` 和语言展示元数据。
- 实现语言归一、读取、持久化和 HTML `lang` 同步函数。
- 使用同步本地资源，避免首阶段引入远程加载和 Suspense 复杂度。

**Expected Verification Result:**

- `npm run build` 通过。
- 语言工具函数单元测试覆盖默认语言、中文区域、英文区域和未知语言。

**Verification Result:**

- 已新增 `i18next`、`react-i18next` 与 `src/i18n` 初始化模块。
- `npm test` 通过，覆盖语言归一、持久化和初始语言选择。
- `npm run build` 通过。

### Task #2: 新增三语言资源骨架

**Status:** Finished

**Files:** Create `src/i18n/locales/zh-CN/*.ts`, `src/i18n/locales/zh-TW/*.ts`, `src/i18n/locales/en-US/*.ts`

**Function:** 提供 `common`、`home`、`settings` 三个 namespace 的初始语言资源。

**Implementation Notes:**

- 简体中文作为默认展示资源。
- 英语作为缺失翻译时的默认回退资源。
- 繁体中文人工维护，不做运行时简繁转换。
- 英语使用 `en-US`。
- 所有动态句子使用 interpolation 参数。

**Expected Verification Result:**

- 三种 locale 都包含相同 namespace 和 key。
- `npm run build` 能通过资源类型检查。

**Verification Result:**

- 已新增 `zh-CN`、`zh-TW`、`en-US` 的 `common`、`home`、`settings` 资源。
- 已新增资源 key 对齐测试，`en-US` 作为 fallback 资源基准。

## Stage #2: 应用壳与页面迁移

### Task #3: 接入应用根部与语言切换入口

**Status:** Finished

**Files:** Modify `src/main.tsx`; Create `src/app/LanguageMenu.tsx`; Create/Modify related tests

**Function:** 在应用根部启用 i18n，并提供用户可操作的语言切换入口。

**Implementation Notes:**

- 在全局 Provider 区域完成 i18n 初始化。
- 新增语言菜单，放在顶部工具区，与主题切换并列。
- 切换语言后调用 i18next changeLanguage，并持久化语言偏好。
- 同步 `document.documentElement.lang`。

**Expected Verification Result:**

- 默认打开应用显示简体中文。
- 切换到繁体中文或英语后，核心入口文案立即变化。
- 刷新后保留上次选择语言。

**Verification Result:**

- 已在入口初始化 i18n，并新增语言选择菜单。
- 切换语言会调用 `changeLanguage`、写入 `localStorage` 并同步 HTML `lang`。

### Task #4: 迁移首页文案与日期格式

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`; Modify related tests

**Function:** 将首页 UI 壳文案、辅助功能文案、placeholder 和日期格式迁移到 i18n。

**Implementation Notes:**

- 迁移统计项、月份、侧边栏空态、搜索 placeholder、composer placeholder、保存位置提示、发送和帮助 aria-label、展开收起、工具按钮 label。
- `formatNoteTimestamp` 接收 locale 或从翻译上下文获取 locale。
- 用户笔记内容、标签名、Field 名保持原样。

**Expected Verification Result:**

- 首页在三种语言下文案可切换。
- 日期格式跟随当前语言。
- 首页相关测试通过。

**Verification Result:**

- 首页 UI 壳文案、placeholder、aria-label 和日期格式已接入 i18n。
- 用户笔记内容、标签名、Field 名保持原样。

### Task #5: 迁移同步设置页和全局组件文案

**Status:** Finished

**Files:** Modify `src/pages/settings/SyncSettingsPage.tsx`, `src/app/ThemeToggle.tsx`, `src/app/BackendStatusToast.tsx`; Modify related tests

**Function:** 将设置页、主题切换和 backend 连接失败 toast 的 UI 文案迁移到 i18n。

**Implementation Notes:**

- 迁移设置页标题、说明、表单 label、placeholder、按钮、状态 pill、结果面板、状态面板、校验信息。
- `formatUnixTimestamp` 根据当前语言 locale 格式化。
- 后端返回的错误 message 第一阶段保持原样。
- 主题切换按钮的 `aria-label` 和 `title` 使用翻译。

**Expected Verification Result:**

- 设置页在三种语言下文案可切换。
- 现有 `SyncSettingsPage`、`ThemeToggle`、`App` 测试更新后通过。
- backend toast 文案使用当前语言。

**Verification Result:**

- 设置页、主题切换和 backend toast 已迁移到 i18n。
- 后端返回错误文本继续原样展示。

## Stage #3: 开发规范与整体验证

### Task #6: 增加裸文案检查或测试约束

**Status:** Finished

**Files:** Create `src/i18n/resources.test.ts`

**Function:** 降低后续新增 UI 裸文案的概率。

**Implementation Notes:**

- 优先用轻量测试或脚本检查核心页面是否仍存在明显裸中文 UI 文案。
- 检查范围先覆盖 `src/app`、`src/pages`，避免误伤 API mock 数据和用户内容 fixture。
- 如检查规则存在误报，记录允许项和原因。

**Expected Verification Result:**

- 新增检查可在 `npm run test` 或独立命令中稳定运行。
- 检查不会阻塞当前 mock 数据、测试说明和代码注释。

**Verification Result:**

- 已新增 `src/i18n/resources.test.ts`。
- 测试覆盖资源 key 对齐，并检查 `src/app`、`src/pages` 非测试组件中没有裸中文 UI 文案。

### Task #7: 最终回归与计划状态回写

**Status:** Finished

**Files:** Modify `docs/exec-plans/active/i18n/r006-i18n-foundation.md`

**Function:** 完成整体构建、测试和执行计划状态更新。

**Implementation Notes:**

- 运行 `npm run test`。
- 运行 `npm run build`。
- 根据实际完成情况将任务状态更新为 `Finished`。
- 每个 Stage 完成后按项目规则进行一次原子提交，commit message 必须符合 Conventional Commits 防火墙规则。

**Expected Verification Result:**

- 所有自动化测试通过。
- 生产构建通过。
- 执行计划记录真实完成状态和验证结果。

**Verification Result:**

- `npm test` 通过：10 个测试文件，37 个测试。
- `npm run build` 通过：TypeScript 编译和 Vite 生产构建成功。

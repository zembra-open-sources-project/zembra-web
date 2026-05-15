# r005-light-theme-mode 执行计划

日期：2026-05-15

## Related Docs

- 需求澄清文档：`docs/request-clarify/home-ui/r005-light-theme-mode.md`
- 设计文档：`docs/design-docs/home-ui/r005-light-theme-mode.md`

## Stage #1: 主题基础设施

### Task #1: 增加主题状态工具

**Status:** Finished

**Files:** Create `src/app/theme.ts`, `src/app/theme.test.ts`, `src/app/ThemeProvider.tsx`, `src/app/ThemeToggle.tsx`; Modify `src/app/App.tsx`

**Function:** 提供浅色默认、深色、跟随系统、`localStorage` 记忆和 DOM `data-theme` 写入能力。

**Implementation Notes:** 主题偏好类型限制为 `system | light | dark`；默认值为 `light`；系统主题只在偏好为 `system` 时参与实际主题解析；不新增依赖。

**Expected Verification Result:** `npm run test -- src/app/theme.test.ts` 通过；首次渲染时 `document.documentElement.dataset.theme` 为 `light`。

## Stage #2: 视觉 token 化和页面接入

### Task #2: 定义全局主题 token

**Status:** Finished

**Files:** Modify `src/styles/main.css`

**Function:** 在全局 CSS 中定义 light/dark 两套 CSS 变量，覆盖背景、文本、面板、边框、强调色、阴影和反馈色。

**Implementation Notes:** 使用 `:root` 表示浅色默认，`html[data-theme="dark"]` 表示深色；保留 Tailwind v4；不改变布局尺寸。

**Expected Verification Result:** 浅色和深色都能通过 CSS 变量渲染，不依赖组件硬编码主背景色。

### Task #3: 首页接入主题 token 和切换控件

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`

**Function:** 首页从硬编码深色迁移到主题 token，品牌栏增加主题切换控件。

**Implementation Notes:** 仅替换视觉类名；不改变 notes store、filter、composer 提交和路由行为。

**Expected Verification Result:** `/` 默认浅色，切换深色后保留原深色层次；搜索、筛选、composer 行为不变。

### Task #4: 设置页和 Toast 接入主题 token

**Status:** Finished

**Files:** Modify `src/pages/settings/SyncSettingsPage.tsx`, `src/app/BackendStatusToast.tsx`

**Function:** 同步设置页和全局 Toast 使用主题 token，设置页 header 增加主题切换控件。

**Implementation Notes:** 仅替换视觉类名；不改 Supabase sync 表单、保存、测试连接和手动同步逻辑。

**Expected Verification Result:** `/settings/sync` 默认浅色，切换深色后控件和反馈状态仍清晰可读。

## Stage #3: 验证与记录

### Task #5: 回归验证并更新执行计划

**Status:** Finished

**Files:** Modify `docs/exec-plans/active/home-ui/r005-light-theme-mode.md`

**Function:** 运行测试和构建，记录验证结果与实现进度。

**Implementation Notes:** 本需求完成后按项目规则提交一次 conventional commit，提交信息需包含具体技术说明。

**Expected Verification Result:** `npm run test` 和 `npm run build` 通过；开发记录包含验证命令和结果。

## 开发记录

- 2026-05-15：已完成需求澄清、设计文档和执行计划，确认默认浅色、支持 system/light/dark、覆盖首页、同步设置页和 Toast。
- 2026-05-15：已新增主题状态工具、Provider、主题切换控件和主题工具测试；App 已接入 ThemeProvider。
- 2026-05-15：已在全局 CSS 中定义 light/dark 主题 token，浅色通过 `:root` 默认生效，深色通过 `html[data-theme="dark"]` 生效。
- 2026-05-15：首页、同步设置页和 backend 连接失败 Toast 已迁移到主题 token；首页和设置页均已接入主题切换控件。
- 2026-05-15：已通过 `npm run test -- src/app/theme.test.ts`、`npm run test`、`npm run build`；本地 Vite 服务运行在 `http://127.0.0.1:5174/`，浏览器验证默认浅色、深色切换、设置页主题继承均正常。

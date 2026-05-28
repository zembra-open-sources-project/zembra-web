# r017-settings-module-boundary 执行计划

日期：2026-05-28

需求澄清文档：本次为小范围模块边界治理，用户已明确目标：确认设置页是否独立；若不独立，则改造为独立模块，便于 worktree 中重构设置页布局且不影响主干其他功能。

设计文档：本次不改变产品行为和 UI 布局，采用轻量执行计划承载改造边界。

## 目标

让 Settings 相关入口、打开状态和弹窗挂载逻辑收敛在 `src/pages/settings/` 模块内，首页只依赖一个设置模块入口组件，避免后续在 worktree 中重构设置页布局时继续修改首页主体文件。

## 边界

- 不重构 SettingsModal 内部布局。
- 不修改 Supabase 设置表单业务逻辑。
- 不新增依赖。
- 不改变首页工具栏视觉和设置弹窗交互。

## Stage 1：设置模块边界收敛

状态：Finished

### Task 1.1：新增 settings 模块入口组件

状态：Finished

功能：在 settings 模块内提供一个自管理打开状态的入口组件。

实现要点：
- 创建 `src/pages/settings/SettingsModule.tsx`。
- 组件内部维护 `isOpen` 状态，并负责渲染设置图标按钮和 `SettingsModal`。
- 通过 props 接收 `client?: SyncClient`，保持测试注入能力。
- 设置按钮文案继续使用 `settings` namespace。

预期测试：
- 首页点击“设置”仍打开 `role="dialog"` 且关闭按钮可关闭。

完成记录：
- 已创建 `src/pages/settings/SettingsModule.tsx`，入口组件内部维护打开状态并挂载 `SettingsModal`。
- 已保留 `client?: SyncClient` 注入能力。

### Task 1.2：首页改为只组合 settings 模块

状态：Finished

功能：删除首页对设置弹窗状态、`lucide-react` Settings 图标和 `SettingsModal` 的直接依赖。

实现要点：
- 修改 `src/pages/home/HomePage.tsx`，移除 `isSettingsOpen` 状态。
- 用 `<SettingsModule client={syncClient} />` 替换原设置按钮和弹窗条件渲染。
- 保持 Sync、ThemeToggle 和其他 toolbar 逻辑不变。

预期测试：
- `npm run test -- src/pages/home/HomePage.test.tsx src/pages/settings/SettingsModal.test.tsx`
- `npm run build`

完成记录：
- 已从 `src/pages/home/HomePage.tsx` 移除设置弹窗状态和直接 `SettingsModal` 依赖。
- 首页仅通过 `<SettingsModule client={syncClient} />` 组合设置模块。
- `npm run test -- src/pages/home/HomePage.test.tsx src/pages/settings/SettingsModal.test.tsx` 已通过，2 个测试文件、12 个测试。
- `npm run build` 已通过，TypeScript 与 Vite 生产构建正常。

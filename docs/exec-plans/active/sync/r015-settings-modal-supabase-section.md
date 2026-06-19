# r015-settings-modal-supabase-section 执行计划

日期：2026-05-28

需求澄清文档：`docs/request-clarify/sync/r015-settings-modal-supabase-section.md`

设计文档：`docs/design-docs/sync/r015-settings-modal-supabase-section.md`

## 目标

将现有独立 Supabase 同步设置页改造成首页可打开的 Settings modal。Settings 内只保留 Supabase 配置、Enable sync、Test 和 Save；手动 Sync 动作移动到首页。

## 架构与边界

- 沿用 `src/api/sync.client.ts` 作为前端同步 API 边界，不引入 Supabase SDK，不修改 `/sync/*` 后端契约。
- Settings modal 由首页状态控制打开关闭，Supabase 配置 section 独立维护加载、表单、测试、保存和启用状态。
- 首页承载手动同步入口，调用 `syncClient.runSync()` 并在首页附近展示反馈。
- UI 文案使用 `Secret key`，不显示 `service role key`、`role key` 或 secret configured 状态。

## Stage 1：Settings modal 结构落地

### Task 1.1：抽出 Supabase 配置 section

状态：Finished

功能：把 `SyncSettingsPage` 中的配置表单能力收敛为可嵌入 Settings modal 的 Supabase section。

实现要点：

- 创建 `src/pages/settings/SupabaseSettingsSection.tsx`，接收可选 `client?: SyncClient` 以便测试注入。
- 从 `src/pages/settings/SyncSettingsPage.tsx` 迁移配置加载、URL、Secret key、Interval seconds、Test、Save、Enable sync 状态逻辑。
- 移除 section 内的 status cursor 列表、manual sync 结果和 `Save & Enable Sync` 逻辑。
- Enable sync 使用 switch 或等效 checkbox 控件表达真实启用状态；切换时调用 `client.updateConfig()` 持久化当前表单值和新 `enabled` 值。
- Enable sync 切换失败时回滚到切换前状态，并在 section 内展示错误。
- `Secret key` 输入为空时保留现有后端语义，继续由 `createUpdateSyncConfigRequest()` 决定是否发送 `secret_key`。
- 保留 `validateIntervalSeconds()` 或迁移到同文件私有函数；文档字符串说明函数用途、参数和返回值。

预期测试：

- `npm run test -- src/pages/settings/SupabaseSettingsSection.test.tsx`
- 覆盖配置加载、Test 不保存、Save 不触发 runSync、Enable sync 成功持久化、Enable sync 失败回滚。

完成记录：

- 已创建 `SupabaseSettingsSection`，配置加载、Test、Save、Enable sync switch 均由 section 内部维护。
- 已移除 Settings section 内的手动 Sync、cursor 状态展示和 secret configured 状态 UI。

### Task 1.2：实现 Settings modal 外壳

状态：Finished

功能：新增全局设置弹窗外壳，并把 Supabase section 放入 Settings 内。

实现要点：

- 创建 `src/pages/settings/SettingsModal.tsx`，提供遮罩、标题、关闭按钮和 section 容器。
- Modal 使用 `role="dialog"`、`aria-modal="true"` 和可访问名称 `Settings`。
- 支持关闭按钮和遮罩点击关闭；如实现 Escape 关闭，需要补充测试。
- Modal 宽度使用响应式上限，窄屏下保持输入框和动作按钮不重叠。
- Settings 内只渲染 Supabase section，不做完整多分类设置系统。

预期测试：

- `npm run test -- src/pages/settings/SettingsModal.test.tsx`
- 覆盖渲染 dialog、关闭按钮关闭、遮罩点击关闭、Supabase section 可见。

完成记录：

- 已创建 `SettingsModal`，提供 dialog、遮罩、关闭按钮和 Supabase section 容器。

### Task 1.3：首页 Settings 入口改为打开 modal

状态：Finished

功能：首页 Settings 图标不再跳转 `/settings/sync`，改为打开 Settings modal。

实现要点：

- 修改 `src/pages/home/HomePage.tsx`，移除 Settings 入口的 `Link` 跳转，改为 button 控制 `isSettingsOpen`。
- 在 `HomePage` 中渲染 `SettingsModal`，关闭后保持首页当前笔记筛选和编辑状态不变。
- 删除或停用 `src/pages/settings/SyncSettingsPage.tsx` 的路由依赖；如保留文件，仅作为兼容薄包装，不再作为主要入口。
- 修改 `src/app/App.tsx`，移除 `/settings/sync` 路由，除非后续确认需要旧 URL 兼容。

预期测试：

- `npm run test -- src/pages/home/HomePage.test.tsx src/app/App.test.tsx`
- 覆盖首页点击 Settings 打开 modal，点击关闭后 dialog 消失。

完成记录：

- 首页 Settings 图标已改为打开 modal。
- `App` 已移除 `/settings/sync` 主路由，保留 `SyncSettingsPage` 作为兼容薄包装文件。

完成 Stage 1 后验证：

- `npm run test -- src/pages/settings/SupabaseSettingsSection.test.tsx src/pages/settings/SettingsModal.test.tsx src/pages/home/HomePage.test.tsx src/app/App.test.tsx`
- `npm run build`
- 如修改了代码，提交信息使用 `feat: add settings modal supabase section`

## Stage 2：首页手动 Sync 动作迁移

### Task 2.1：首页新增手动同步入口

状态：Finished

功能：把手动 `Sync` 动作移动到首页，调用现有 `syncClient.runSync()`。

实现要点：

- 修改 `src/pages/home/HomePage.tsx`，在首页顶部工具区添加 `Sync` 图标或短文本按钮。
- 默认使用 `syncClient`，如测试需要可通过轻量依赖注入或可替换模块方式验证调用。
- 点击 `Sync` 时调用 `client.runSync()`，成功后展示 pushed/pulled 摘要，失败后展示错误。
- 反馈展示在首页工具区附近或轻量 toast 区域，不进入 Settings modal。
- 不在首页展示 sync cursor 详情。

预期测试：

- `npm run test -- src/pages/home/HomePage.test.tsx`
- 覆盖点击首页 Sync 调用 `runSync()`，成功展示同步结果，失败展示错误信息。

完成记录：

- 首页工具区已新增手动 Sync 入口，成功和失败反馈展示在首页侧栏工具区附近。

### Task 2.2：清理 Settings 内手动同步残留

状态：Finished

功能：确保 Settings modal 内不再出现手动 Sync 入口和手动同步结果。

实现要点：

- 删除 `SyncSettingsPage` 或新 section 中的 `isRunning`、`runResult`、`handleRunSync()`、manual sync result UI。
- 删除 Settings 测试中对 `runSync` 的断言，改到首页测试。
- 保持 `syncClient.runSync()` API 和 `src/api/sync.client.test.ts` 不变。

预期测试：

- `npm run test -- src/pages/settings/SupabaseSettingsSection.test.tsx src/pages/home/HomePage.test.tsx src/api/sync.client.test.ts`
- Settings 相关测试中 `runSync` 不被调用；首页测试中 `runSync` 被调用。

完成记录：

- Settings 相关实现和测试不再触发 `runSync()`。
- `syncClient.runSync()` API 保持不变，首页负责调用。

完成 Stage 2 后验证：

- `npm run test -- src/pages/home/HomePage.test.tsx src/pages/settings/SupabaseSettingsSection.test.tsx src/api/sync.client.test.ts`
- `npm run build`
- 如修改了代码，提交信息使用 `feat: move manual sync action to home`

## Stage 3：i18n 与文案收口

### Task 3.1：更新 Settings 和 Home 文案资源

状态：Finished

功能：让英文、简体中文、繁体中文文案符合 r015 的新语义。

实现要点：

- 修改 `src/i18n/locales/en-US/settings.ts`、`src/i18n/locales/zh-CN/settings.ts`、`src/i18n/locales/zh-TW/settings.ts`。
- `settings.title` 使用 Settings / 设置 / 設定。
- Supabase section 使用 `settings.supabase.*` 结构，包含 `enableSync`、`url`、`secretKey`、`intervalSeconds`。
- Secret key 已配置时输入框显示掩码值，编辑时切换为空白新 key 输入；不再使用 placeholder 表达“保留现有值”。
- actions 只保留 `Test`、`Save` 和关闭相关文案；删除 `Save & Enable Sync` 文案。
- 修改或新增 home namespace 中 `home.actions.sync` 文案，确保首页 Sync 入口可翻译。
- UI 中不得出现 `service role key`、`role key`、`Configured` / `Not configured` 的 secret 状态文案。

预期测试：

- `npm run test -- src/i18n/locale.test.ts src/i18n/resources.test.ts`
- `rg -n "service role key|role key|Save & Enable Sync|Configured|Not configured" src`

完成记录：

- Settings 文案已更新为 `Secret key`、`Test`、`Save` 和 Settings modal 语义。
- Home 文案已新增 Sync 入口和同步结果摘要。

### Task 3.2：按行为更新测试覆盖

状态：Finished

功能：用用户可观察行为覆盖 r015 验收标准，避免绑定静态样式细节。

实现要点：

- 新增 `src/pages/settings/SupabaseSettingsSection.test.tsx`，替代旧 `SyncSettingsPage.test.tsx` 的页面工作台断言。
- 新增或更新 `src/pages/settings/SettingsModal.test.tsx`。
- 更新 `src/pages/home/HomePage.test.tsx`，覆盖 Settings modal 打开关闭和首页 Sync。
- 更新 `src/app/App.test.tsx`，确保主路由仍渲染首页；如移除 `/settings/sync`，删除旧路由预期。
- 测试只断言语义角色、可访问名称、数据渲染、状态变化和 API 调用结果，不断言 Tailwind class 或固定尺寸。

预期测试：

- `npm run test -- src/pages/settings/SupabaseSettingsSection.test.tsx src/pages/settings/SettingsModal.test.tsx src/pages/home/HomePage.test.tsx src/app/App.test.tsx src/i18n/resources.test.ts`

完成记录：

- 已新增 Supabase section、Settings modal 和首页 Sync 行为测试。
- 已按语义角色、可访问名称、状态变化和 API 调用结果断言，未新增静态样式断言。

## 验证记录

- `npm run test -- src/pages/settings/SupabaseSettingsSection.test.tsx src/pages/settings/SettingsModal.test.tsx src/pages/home/HomePage.test.tsx src/app/App.test.tsx src/i18n/resources.test.ts src/i18n/locale.test.ts src/api/sync.client.test.ts`：通过，7 个测试文件、37 个测试。
- `npm run test`：通过，14 个测试文件、70 个测试。
- `rg -n "service role key|role key|Save & Enable Sync|Configured|Not configured" src/pages src/i18n --glob '!*.test.*'`：无匹配。
- `npm run build`：通过。

完成 Stage 3 后验证：

- `npm run test`
- `npm run build`
- 手工检查桌面和窄屏：Settings 是 modal，Supabase 是 section，Settings 内只有 Test / Save，首页能看到 Sync，按钮和文本不重叠。
- 如修改了代码，提交信息使用 `test: cover settings modal sync behavior`

## 验收检查清单

- 首页点击 Settings 打开 popup/modal，不跳转独立同步设置页。
- Settings modal 内 Supabase section 可加载和保存配置。
- Enable sync switch 表达真实后端启用状态，失败会回滚并提示。
- Settings modal 内只出现 `Test` 和 `Save` 配置动作。
- 首页提供手动 `Sync` 入口，并能展示成功或失败反馈。
- UI 中不出现 `service role key`、`role key`、secret configured 状态文案。
- 前端仍只通过 `syncClient` 访问后端同步 API。
- `npm run test` 和 `npm run build` 通过。

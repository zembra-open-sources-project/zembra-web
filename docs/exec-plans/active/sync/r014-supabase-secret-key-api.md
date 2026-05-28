# r014-supabase-secret-key-api 执行计划

日期：2026-05-28

需求澄清文档：`docs/request-clarify/sync/r014-supabase-secret-key-api.md`

设计文档：`docs/design-docs/sync/r014-supabase-secret-key-api.md`

## Stage 1：同步 API 契约适配

### Task 1.1：更新类型和字段映射

状态：Finished

功能：让 sync client 按最新 OpenAPI 读写 Supabase secret key 字段。

实现要点：

- `SyncConfigResponse` 使用 `secret_key_configured`。
- `UpdateSyncConfigRequest` 使用 `secret_key`。
- `TestSyncConfigRequest` 使用 `secret_key`。
- 页面级 DTO 继续保持 `serviceRoleKey` 命名，避免 UI 层感知后端字段变化。

预期测试：

- `npm run test -- src/api/sync.client.test.ts`
- `npm run build`

## Stage 2：同步启用交互修正

### Task 2.1：使用 Save & Enable Sync 表达启用动作

状态：Finished

功能：移除顶部 enable checkbox，把启用同步作为明确提交动作，避免用户在填写 URL 前触发后端校验。

实现要点：

- 保留 `Save` 用于保存 disabled 配置。
- 新增 `Save & Enable Sync` 动作，提交时强制 `enabled=true`。
- 顶部状态继续只展示后端已保存状态。
- `Sync` 仍只允许在后端已启用后执行。

预期测试：

- `npm run test -- src/pages/settings/SyncSettingsPage.test.tsx`
- `npm run build`

## Stage 3：动作按钮响应式布局修正

### Task 3.1：重构同步设置页按钮组布局

状态：Finished

功能：修复英文长按钮文案在固定高度按钮内换行挤压的问题，让同步设置页动作按钮在不同宽度下保持可读。

实现要点：

- 按钮组使用单行 flex 布局，按钮按内容自适应宽度，不强制等宽。
- 按钮组用满一行空间，剩余空间由父容器均匀分布到按钮之间。
- 按钮不使用固定高度，改为 `min-height` 和垂直内边距。
- 按钮文本不换行；短动作使用 `Test`、`Save`、`Sync`，关键动作保留 `Save & Enable Sync`。
- 不新增绑定静态视觉细节的测试断言。

预期测试：

- `npm run test -- src/pages/settings/SyncSettingsPage.test.tsx`
- `npm run build`

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

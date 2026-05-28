# r014-supabase-secret-key-api 设计文档

日期：2026-05-28

需求澄清文档：`docs/request-clarify/sync/r014-supabase-secret-key-api.md`

## 设计结论

推荐只在 `src/api` 边界适配后端字段变化。前端页面继续使用已有表单状态和展示逻辑，避免把后端命名变化扩散到 UI 层。

## 契约调整

| 旧字段 | 新字段 | 前端 DTO |
| --- | --- | --- |
| `service_role_key` | `secret_key` | `serviceRoleKey` |
| `service_role_key_configured` | `secret_key_configured` | `serviceRoleKeyConfigured` |

## 改动范围

| 文件 | 改动 |
| --- | --- |
| `src/api/types.ts` | 将后端 sync request/response 字段更新为 `secret_key` 和 `secret_key_configured`。 |
| `src/api/sync.client.ts` | 更新配置响应映射、保存请求体和测试请求体字段。 |
| `src/api/sync.client.test.ts` | 更新 mock 响应和请求体断言。 |

## 验证

- `npm run test -- src/api/sync.client.test.ts`
- `npm run build`

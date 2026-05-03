# r001-openapi-client 执行计划

日期：2026-05-03

需求澄清文档：`docs/request-clarify/api-client/r001-openapi-client.md`
设计文档：`docs/design-docs/api-client/r001-openapi-client.md`

## Stage 1：API Client 接入

| Task | 状态 | 功能 | 实现要点 | 预期测试结果 |
| --- | --- | --- | --- | --- |
| 1.1 | Finished | 补齐后端类型和 HTTP 基础设施 | 定义后端响应类型、`ApiError`、JSON 请求工具 | 等待最终验证 |
| 1.2 | Finished | 实现真实 `NotesClient` | 接入 `/notes` 和 `/notes/{note_ref}/tags`，映射为 `NoteDto` | 等待最终验证 |
| 1.3 | Finished | 接入 feature store | 将 mock client 替换为默认 HTTP client，测试模式保留 mock 防止单元测试依赖本机服务 | 应用测试和构建已通过 |

## 开发记录

- 2026-05-03：已确认 OpenAPI 地址为 `/api-docs/openapi.json`，本次不新增依赖。
- 2026-05-03：已实现 HTTP client 和默认 client 入口，首次验证发现测试环境直连后端被 sandbox 拦截，已改为测试模式使用 mock client。
- 2026-05-03：已补充 notes client 单元测试，覆盖列表标签补齐、创建请求体、错误响应和字段映射。

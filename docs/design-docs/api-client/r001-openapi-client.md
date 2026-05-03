# r001-openapi-client 设计文档

日期：2026-05-03

需求澄清文档：`docs/request-clarify/api-client/r001-openapi-client.md`

## 设计结论

推荐在 `src/api` 下实现轻量 HTTP client，继续让 feature store 只依赖 `NotesClient` 接口。这样 UI 层保持现有结构，后端字段、错误格式和路径细节集中在 API 层。

## API Client 结构

| 文件 | 职责 |
| --- | --- |
| `src/api/types.ts` | 定义前端 DTO、输入模型、后端响应模型和错误类型 |
| `src/api/http.ts` | 提供通用 JSON 请求、URL 拼接、错误解析 |
| `src/api/notes.client.ts` | 实现 `NotesClient`，封装 `/notes`、标签同步和 DTO 映射 |
| `src/api/client.ts` | 暴露默认 API client 创建入口 |
| `src/features/notes/noteStore.ts` | 使用默认真实 client 加载和创建笔记 |

## 字段映射

| 后端字段 | 前端字段 | 说明 |
| --- | --- | --- |
| `note.id` | `id` | 稳定笔记 ID |
| `note.content` | `content` | 笔记正文 |
| `note.field_id` | `fieldId` | 后端返回字段 ID 时透传 |
| `note.created_at` | `createdAt` | Unix 时间戳 |
| `note.updated_at` | `updatedAt` | Unix 时间戳 |
| `metadata.tags` 或单条标签接口 | `tags` | UI 展示用标签名 |

## 错误处理

| 场景 | 处理 |
| --- | --- |
| 非 2xx 响应 | 抛出 `ApiError`，包含 HTTP 状态、错误码和消息 |
| JSON 为空 | 返回 `undefined`，用于 `204 No Content` |
| 后端错误格式 | 优先读取 `error.code`、`error.message` 和 `error.details` |

## 配置

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_ZEMBRA_API_BASE_URL` | `http://127.0.0.1:3000` | 后端 API base URL |

## 兼容策略

当前列表接口只返回 `NoteRecord`，不包含标签 metadata。client 在获取列表后并发调用 `GET /notes/{note_ref}/tags` 补齐标签。创建接口返回 `NoteResponse`，可直接使用 `metadata.tags` 映射 UI 标签。

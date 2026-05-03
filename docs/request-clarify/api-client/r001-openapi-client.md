# r001-openapi-client 需求澄清

日期：2026-05-03

## 需求结论

用户已启动后端服务 `http://127.0.0.1:3000`，并说明后端满足 OpenAPI 标准。本次开发目标是根据已实现 API，为 Web 端补齐真实 client 代码，让现有笔记界面通过 API Client 访问后端。

## API 发现

| 项目 | 结论 |
| --- | --- |
| OpenAPI 地址 | `http://127.0.0.1:3000/api-docs/openapi.json` |
| Swagger UI | `http://127.0.0.1:3000/swagger-ui/` |
| 健康检查 | `GET /health` |
| 笔记列表 | `GET /notes?limit=` |
| 创建笔记 | `POST /notes` |
| 更新笔记 | `PATCH /notes/{note_ref}` |
| 删除笔记 | `DELETE /notes/{note_ref}` |
| 标签查询 | `GET /tags`、`GET /notes/{note_ref}/tags` |
| 领域查询 | `GET /fields` |

## 范围

- 实现 Web 端 HTTP client，使用原生 `fetch`，不新增生产依赖。
- 保留现有 `NotesClient` 边界，避免 UI 组件直接依赖后端字段命名。
- 将后端 `snake_case` 记录映射为前端现有 `NoteDto`。
- 支持通过 Vite 环境变量配置 API base URL，默认指向 `http://127.0.0.1:3000`。

## 暂不处理

- 不直接引入 SQLite、ORM 或 Supabase SDK。
- 不实现复杂离线缓存。
- 不做 UI 自动化测试；本次仅做单元测试、类型检查和构建验证。

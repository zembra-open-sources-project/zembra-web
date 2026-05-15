# R007 Backend URL Gate 执行计划

日期：2026-05-15

需求澄清文档：`docs/request-clarify/api-client/r007-backend-url-gate.md`
设计文档：`docs/design-docs/api-client/r007-backend-url-gate.md`

## Stage 1：后端 URL 门禁

| Task | 状态 | 功能 | 实现要点 | 预期测试结果 |
| --- | --- | --- | --- | --- |
| 1 | Finished | 后端 URL 配置和可达性检查 | 新增配置模块，封装 localStorage、URL 规范化和基于 `GET /health` 的 fetch 探测 | 输入可达 URL 后能保存，失败时返回错误 |
| 2 | Finished | 登录式 URL 输入界面 | 新增 App 根门禁组件，首次访问显示输入框，通过后渲染当前首页 | 首次访问展示输入页，通过检查进入笔记页 |
| 3 | Finished | API Client 动态读取 URL | 默认 HTTP client 请求时读取已保存 URL | 保存 URL 后无需刷新即可让笔记页请求新后端 |
| 4 | Finished | 单元测试 | 覆盖首次输入、可达跳转、不可达错误、已保存 URL 失败回退和 `/health` 探测路径 | `npm test` 通过 |
| 5 | Finished | 前端关键日志 | 补充 URL 门禁和可达性检查的开始、成功、失败日志 | 浏览器控制台能看到 URL、health URL、HTTP status 或异常原因 |
| 6 | Finished | 移除未确认路径前缀 | 默认后端地址改为 OpenAPI 已确认的服务根地址，所有示例只使用服务根 URL | 代码和测试中不再出现未确认路径前缀作为后端示例或默认值 |

## 进度记录

- 2026-05-15：创建需求澄清、设计文档和执行计划。
- 2026-05-15：完成后端 URL 门禁、动态 API base URL 和相关单元测试；`npm test` 与 `npm run build` 均通过。
- 2026-05-15：根据实时 OpenAPI 确认健康检查 API 为 `GET /health`，修复错误探测 base URL 本身的问题，并补充前端控制台关键日志。
- 2026-05-15：整改未确认路径前缀遗留，默认地址与输入示例改为 `http://127.0.0.1:3000`，并把 API 契约查证要求写入 AGENTS。
- 2026-05-15：确认后端健康检查响应缺少浏览器需要的 CORS 允许源；按用户要求，dev 环境继续直连用户输入的真实后端 URL，不通过前端代理绕过 CORS。

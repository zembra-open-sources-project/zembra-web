# R007 Backend URL Gate 执行计划

日期：2026-05-15

需求澄清文档：`docs/request-clarify/api-client/r007-backend-url-gate.md`
设计文档：`docs/design-docs/api-client/r007-backend-url-gate.md`

## Stage 1：后端 URL 门禁

| Task | 状态 | 功能 | 实现要点 | 预期测试结果 |
| --- | --- | --- | --- | --- |
| 1 | Finished | 后端 URL 配置和可达性检查 | 新增配置模块，封装 localStorage、URL 规范化和 fetch 探测 | 输入可达 URL 后能保存，失败时返回错误 |
| 2 | Finished | 登录式 URL 输入界面 | 新增 App 根门禁组件，首次访问显示输入框，通过后渲染当前首页 | 首次访问展示输入页，通过检查进入笔记页 |
| 3 | Finished | API Client 动态读取 URL | 默认 HTTP client 请求时读取已保存 URL | 保存 URL 后无需刷新即可让笔记页请求新后端 |
| 4 | Finished | 单元测试 | 覆盖首次输入、可达跳转、不可达错误和已保存 URL 失败回退 | `npm test` 通过 |

## 进度记录

- 2026-05-15：创建需求澄清、设计文档和执行计划。
- 2026-05-15：完成后端 URL 门禁、动态 API base URL 和相关单元测试；`npm test` 与 `npm run build` 均通过。

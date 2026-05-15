# R007 Backend URL Gate 设计文档

日期：2026-05-15

需求澄清文档：`docs/request-clarify/api-client/r007-backend-url-gate.md`

## 设计结论

在 React App 根组件增加后端 URL 门禁。门禁负责读取本地配置、检查后端可达性、保存 URL，并在通过后渲染现有 Router。API Client 改为请求时读取已保存 URL，避免用户输入 URL 后还需要刷新页面。

## 模块设计

| 模块 | 责任 |
| --- | --- |
| `src/api/backendConfig.ts` | 管理后端 URL 本地配置、规范化 URL、执行可达性检查 |
| `src/api/client.ts` | 默认 API client 改为读取动态后端 URL |
| `src/app/BackendUrlGate.tsx` | 渲染后端 URL 输入界面和错误提示，控制通过后进入应用 |
| `src/app/App.tsx` | 将 Router 包在后端 URL 门禁之后 |

## 可达性策略

| 场景 | 行为 |
| --- | --- |
| URL 为空 | 不保存，显示输入错误 |
| URL 缺少协议 | 默认补全为 `http://` |
| HTTP 可请求且返回小于 500 | 视为可达 |
| 网络异常、超时或 5xx | 视为不可达 |

检查默认请求配置的 API Base URL 本身。这样可以兼容当前后端未提供专用 health endpoint 的阶段。

## 数据持久化

后端 URL 保存到 `localStorage`，key 由 `backendConfig` 模块统一维护。测试环境仍保留 mock client 行为，避免单元测试依赖真实后端。

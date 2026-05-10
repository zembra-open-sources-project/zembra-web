# Backend 连接失败 Toast 提示设计

日期：2026-05-10

需求澄清文档：`docs/request-clarify/api-client/r003-backend-connection-toast.md`

## 设计结论

在 API 请求层识别网络连接失败并派发全局事件，在 App 根组件订阅该事件并渲染一个 5 秒自动消失的 toast。

## 方案

| 模块 | 设计 |
| --- | --- |
| `src/api/http.ts` | 包装 `fetch` 调用，只在请求没有拿到 HTTP 响应时派发 backend 连接失败通知，然后继续抛出原始错误。 |
| `src/app/backendConnectionToast.ts` | 提供事件名、事件派发函数和订阅函数，隔离 DOM `CustomEvent` 细节。 |
| `src/app/App.tsx` | 根组件维护 toast 可见状态，收到事件后显示提示并重置 5 秒自动关闭计时器。 |
| `src/app/BackendStatusToast.tsx` | 负责 toast UI，使用 `role="status"` 和固定定位，不阻塞页面操作。 |

## 关键决策

| 决策点 | 选择 |
| --- | --- |
| 是否新增依赖 | 不新增依赖，避免引入额外 UI 库。 |
| 去重策略 | 根组件只维护一个 backend 连接失败 toast；重复事件刷新 5 秒关闭计时器。 |
| 错误边界 | 只处理网络层失败，不改变 `ApiError` 语义。 |

## 测试设计

| 测试 | 预期 |
| --- | --- |
| `requestJson` 遇到 `fetch` reject | 派发一次 backend 连接失败通知，并继续 reject 原错误。 |
| backend 返回 HTTP 错误 | 不派发连接失败通知，继续抛 `ApiError`。 |
| App 收到连接失败事件 | 显示 toast，5 秒后消失。 |

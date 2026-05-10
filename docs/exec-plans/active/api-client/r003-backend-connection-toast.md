# Backend 连接失败 Toast 提示执行计划

日期：2026-05-10

需求澄清文档：`docs/request-clarify/api-client/r003-backend-connection-toast.md`
设计文档：`docs/design-docs/api-client/r003-backend-connection-toast.md`

## Stage 1：请求层通知

| Task | 状态 | 功能 | 实现要点 | 预期测试 |
| --- | --- | --- | --- | --- |
| 1.1 | Finished | 识别 backend 网络连接失败 | 在 `requestJson` 中捕获 `fetch` 网络异常，派发全局通知后重新抛出 | API 测试覆盖网络失败会派发通知 |
| 1.2 | Finished | 保持 HTTP 错误行为 | 继续使用现有 `ApiError` 处理 HTTP 4xx/5xx | API 测试覆盖 HTTP 错误不派发连接失败通知 |

## Stage 2：全局 Toast 展示

| Task | 状态 | 功能 | 实现要点 | 预期测试 |
| --- | --- | --- | --- | --- |
| 2.1 | Finished | 显示全局 backend 连接失败 toast | App 根组件订阅通知并渲染 toast | App 测试覆盖收到通知后展示 toast |
| 2.2 | Finished | 5 秒后自动消失 | 使用计时器控制可见状态，重复通知重置计时器 | App 测试覆盖 5 秒后 toast 消失 |

## 进度记录

- 2026-05-10：完成需求澄清和方案设计，准备进入实现。
- 2026-05-10：完成请求层网络失败通知、App 全局 toast 和自动关闭测试。

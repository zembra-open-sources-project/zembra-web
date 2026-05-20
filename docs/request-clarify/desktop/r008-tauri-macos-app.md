# R008 Tauri macOS App 需求澄清

日期：2026-05-20

## 需求结论

为 Zembra WebUI 增加一个基于 Tauri v2 的 macOS 桌面应用分发出口。首版只面向本机开发运行，不内置、不启动、不管理后端 sidecar；桌面应用继续通过用户配置的后端服务根地址访问现有 Rust 后端。

## 范围

| 项目 | 结论 |
| --- | --- |
| 桌面框架 | Tauri v2 |
| 目标平台 | macOS |
| 首版运行目标 | 本机开发可运行的 `.app` |
| App 名称 | `Zembra` |
| Bundle identifier | `com.antarxly.zembra` |
| 后端形态 | 外部 Rust 后端，暂不作为 Tauri sidecar 打包 |
| 后端入口 | 复用现有 `BackendUrlGate` 和 `backendConfig` 配置能力 |
| 图标 | 首版使用 Tauri 默认图标占位 |
| 签名与公证 | 首版不处理正式分发签名、公证和 `.dmg` 发布 |
| 自动更新 | 首版不实现 |
| Tauri 原生能力 | 首版不开放文件系统、shell、系统托盘、深度链接等能力 |

## 后端配置要求

| 项目 | 要求 |
| --- | --- |
| 服务地址 | 后端需要监听用户可配置的 host 和 port，默认开发地址可继续使用 `http://127.0.0.1:3000` |
| 健康检查 | 必须提供现有前端已使用的 `GET /health`，用于桌面启动前可达性检查 |
| API 根地址 | 前端配置值表示服务根地址，不默认追加 `/api` 等未确认前缀 |
| CORS | 后端需要允许 Tauri WebView 发起的跨源请求，至少覆盖 `GET /health` 和当前业务 API |
| 请求方法 | 放行当前 API Client 使用的 `GET`、`POST`、`PUT` 等方法 |
| 请求头 | 放行 `Accept`、`Content-Type`，后续如加入认证再同步放行对应认证头 |
| 本机开发来源 | 需要允许 Tauri 开发模式的前端来源，例如 Vite dev server origin |
| 打包后来源 | 需要验证并允许 Tauri 打包后 WebView 的请求来源；若后端 CORS 支持开发白名单，需把该来源纳入配置 |
| 敏感信息 | CORS 和日志配置不得输出 service role key、token、密码等敏感值 |

## 改造成本判断

当前仓库已经具备后端入口配置能力，且前端 API Client 不依赖 Vite proxy。首版 Tauri macOS app 的改造成本为低到中等：Tauri 工程接入、npm scripts、macOS bundle 配置属于低成本；CORS 验证、Tauri 安全策略、打包后请求来源验证属于中等成本。

## 验收标准

- 本机能够通过 Tauri dev 模式启动 `Zembra` 桌面窗口。
- 本机能够构建出 macOS `.app` 产物。
- 桌面应用首次启动时能展示现有后端地址配置入口。
- 输入可达后端地址后，`GET /health` 检查通过并进入首页。
- 首页、同步设置页等现有 API 调用能通过配置的后端地址访问 Rust 后端。
- 首版不要求签名、公证、`.dmg`、自动更新或后端 sidecar。

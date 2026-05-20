# R008 Tauri macOS App 设计文档

日期：2026-05-20

需求澄清文档：`docs/request-clarify/desktop/r008-tauri-macos-app.md`

## 核心功能（WHAT）

为现有 Zembra WebUI 增加 Tauri v2 桌面应用入口，首版只面向 macOS 本机开发运行。Tauri 负责承载 Vite 构建后的 React 静态资源，并生成 `Zembra.app`；后端继续由用户单独启动和配置，桌面端通过现有后端 URL 门禁访问外部 Rust 后端。

### 需求背景（WHY）

Zembra 的当前前端已经具备后端入口配置能力，用户可以输入后端服务根地址并通过 `GET /health` 完成可达性检查。桌面应用首版不需要管理后端进程，因此可以先用 Tauri v2 建立轻量 macOS 分发出口，验证 WebUI 在桌面 WebView 中的可用性，为后续正式分发、签名、公证、sidecar 或自动更新预留边界。

### 需求目标（GOAL）

| 目标 | 说明 |
| --- | --- |
| 桌面入口 | 新增 Tauri v2 工程，运行现有 React WebUI |
| macOS 产物 | 本机能够构建出 `Zembra.app` |
| 应用身份 | App 名称为 `Zembra`，bundle identifier 为 `com.antarxly.zembra` |
| 后端连接 | 继续复用 `BackendUrlGate` 和 `backendConfig`，由用户配置后端服务根地址 |
| 安全边界 | 首版不开放 Tauri 文件系统、shell、系统托盘、深度链接等原生能力 |
| 图标 | 首版使用占位图标，不做正式品牌图标 |

### 范围边界

| 类型 | 内容 |
| --- | --- |
| In Scope | Tauri v2 工程初始化、macOS app 配置、npm scripts、Vite 构建衔接、基础安全配置、开发与构建验证 |
| Out of Scope | backend sidecar、后端进程管理、正式签名、公证、`.dmg`、自动更新、自定义图标、系统托盘、文件系统访问、深度链接 |

## 实现流程（HOW）

### 当前架构

| 模块 | 当前状态 |
| --- | --- |
| `src/app/BackendUrlGate.tsx` | 控制启动前后端 URL 配置和可达性检查 |
| `src/api/backendConfig.ts` | 管理后端 URL 规范化、`localStorage` 持久化和 `GET /health` 探测 |
| `src/api/client.ts` | API Client 在请求时解析当前有效后端服务根地址 |
| `vite.config.ts` | 使用 Vite 构建 React 静态资源，不再依赖 `/api` dev proxy |
| `package.json` | 已有 `dev`、`build`、`test`，尚未接入 Tauri CLI |

### 目标架构

| 层级 | 设计 |
| --- | --- |
| WebUI | 保持现有 React/Vite 结构，桌面端和 Web 端共用同一套 UI 与 API Client |
| Tauri shell | 新增 `src-tauri/`，只负责窗口、应用身份、静态资源承载和 macOS bundle |
| Backend | 由用户外部启动，桌面端通过配置的服务根地址访问 |
| 配置持久化 | 继续使用 WebView `localStorage` 保存后端服务根地址 |

### Tauri 配置设计

| 配置项 | 设计 |
| --- | --- |
| `productName` | `Zembra` |
| `identifier` | `com.antarxly.zembra` |
| `frontendDist` | `../dist` |
| `beforeDevCommand` | `npm run dev` |
| `beforeBuildCommand` | `npm run build` |
| `devUrl` | Vite dev server 地址，使用默认本机开发端口 |
| `bundle.targets` | 首版聚焦 macOS `.app` |
| `windows` | 单主窗口，标题为 `Zembra`，使用稳定初始尺寸 |
| `icons` | 使用占位图标资源 |

### 安全策略

| 项目 | 设计 |
| --- | --- |
| Capabilities | 首版不声明业务原生权限；不开放 `fs`、`shell`、`dialog` 等插件能力 |
| CSP | 允许应用自身资源加载；网络连接需要覆盖用户配置的后端地址，本机开发至少覆盖 `http://127.0.0.1:*` 和 `http://localhost:*` |
| 日志 | 保留现有前端日志，禁止记录 token、service role key、密码等敏感值 |
| 后端边界 | 前端只保存服务根地址，不拼接未确认的 `/api` 前缀 |

### 后端配置要求

| 项目 | 要求 |
| --- | --- |
| 默认开发地址 | `http://127.0.0.1:3000` |
| 健康检查 | `GET /health` 返回小于 500 时视为可达 |
| CORS Origin | 放行 Tauri dev 模式的 Vite origin，以及打包后 Tauri WebView 的实际请求来源 |
| CORS Methods | 至少放行 `GET`、`POST`、`PUT` |
| CORS Headers | 至少放行 `Accept`、`Content-Type`；后续认证再追加认证头 |
| 失败行为 | CORS 或网络失败时，前端停留在后端 URL 输入页并显示不可达错误 |

### 依赖设计

| 依赖 | 类型 | 说明 |
| --- | --- | --- |
| `@tauri-apps/cli` | devDependency | 提供 Tauri dev/build 命令 |
| `tauri` Rust crate | `src-tauri/Cargo.toml` | Tauri shell 运行时 |
| `tauri-build` Rust crate | build dependency | Tauri 构建脚本依赖 |

新增依赖不引入 SQLite driver、ORM、数据库 migration 运行时，也不改变 UI 层数据访问边界。

## 测试用例

### 编译检查

| 用例 | 预期 |
| --- | --- |
| `npm run build` | TypeScript 与 Vite 构建通过 |
| `npm test` | 现有单元测试通过 |
| `npm run tauri build -- --bundles app` | macOS `.app` 构建成功 |

### 手工检查

| 用例 | 预期 |
| --- | --- |
| `npm run tauri dev` | 打开标题为 `Zembra` 的桌面窗口 |
| 首次启动 | 展示现有后端 URL 配置入口 |
| 输入可达后端 | `GET /health` 通过后进入首页 |
| 输入不可达后端 | 停留在配置入口并显示错误 |
| 访问同步设置页 | 能通过配置的后端服务根地址调用同步 API |

### 回归检查

| 用例 | 预期 |
| --- | --- |
| Web dev 模式 | `npm run dev` 仍可运行现有 WebUI |
| Web build | Tauri 接入不破坏现有静态构建 |
| 后端 URL 配置 | `localStorage` key 和解析逻辑保持兼容 |

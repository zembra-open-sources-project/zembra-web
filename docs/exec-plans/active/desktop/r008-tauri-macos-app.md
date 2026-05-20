# R008 Tauri macOS App 执行计划

日期：2026-05-20

需求澄清文档：`docs/request-clarify/desktop/r008-tauri-macos-app.md`
设计文档：`docs/design-docs/desktop/r008-tauri-macos-app.md`

## Stage 1：Tauri 桌面工程接入

| Task | 状态 | 功能 | 实现要点 | 预期测试结果 |
| --- | --- | --- | --- | --- |
| 1 | Finished | 新增 Tauri v2 工程骨架 | 创建 `src-tauri/`、Rust 入口、构建脚本、Tauri 配置和默认 capability 文件 | Tauri CLI 能识别桌面工程 |
| 2 | Finished | 配置 macOS app 身份 | 设置 `productName` 为 `Zembra`，`identifier` 为 `com.antarxly.zembra`，窗口标题为 `Zembra`，首版使用占位图标 | 构建产物显示正确应用名称和 bundle identifier |
| 3 | Finished | 衔接 Vite 构建 | 设置 `frontendDist` 为 `../dist`，配置 dev/build 前置命令，新增 `tauri`、`tauri:dev`、`tauri:build` npm scripts | Tauri CLI 配置读取成功，build 流程能触发 Vite 构建 |

## Stage 2：后端访问与安全边界验证

| Task | 状态 | 功能 | 实现要点 | 预期测试结果 |
| --- | --- | --- | --- | --- |
| 1 | Finished | 保持后端 URL 门禁兼容 | 保持 `BackendUrlGate`、`backendConfig` 和 API Client 逻辑不变，桌面端继续使用 `GET /health` 检查外部后端 | Tauri 构建不改变后端 URL 配置入口 |
| 2 | Finished | 配置 Tauri 安全策略 | 首版不开放文件系统、shell、系统托盘、深度链接等原生能力；CSP 允许应用资源和本机开发后端连接 | Tauri 配置中不包含无关原生权限 |
| 3 | Finished | 明确后端 CORS 要求 | 在需求澄清和设计文档中记录后端需放行 Tauri dev origin、打包后 WebView origin、`GET/POST/PUT`、`Accept`、`Content-Type` | 后端 CORS 要求已文档化，实际联调留给后端服务运行时验证 |

## Stage 3：构建验证与计划回写

| Task | 状态 | 功能 | 实现要点 | 预期测试结果 |
| --- | --- | --- | --- | --- |
| 1 | Finished | 前端回归验证 | 运行 `npm test` 和 `npm run build`，确认 Tauri 接入不破坏现有 WebUI | 测试和 Web 构建通过 |
| 2 | Finished | macOS app 构建验证 | 运行 Tauri app bundle 构建命令，生成本机开发可运行的 `.app` | `Zembra.app` 成功产出 |
| 3 | Finished | 更新执行计划进度 | 在本文件记录实现过程、验证结果和未处理范围 | 执行计划准确反映当前实现状态 |

## 进度记录

- 2026-05-20：完成需求澄清、设计文档和执行计划；首版范围限定为本机开发可运行的 macOS Tauri app，不包含 backend sidecar、签名、公证、`.dmg`、自动更新或自定义图标。
- 2026-05-20：完成 Tauri v2 工程接入，新增 macOS app 配置、Rust shell、capability、占位图标和 npm scripts；运行 `cargo check` 通过。
- 2026-05-20：运行 `npm test` 通过，结果为 11 个测试文件、49 个测试用例全部通过；运行 `npm run build` 通过。
- 2026-05-20：运行 Tauri app bundle 构建通过，产物为 `src-tauri/target/release/bundle/macos/Zembra.app`；核对 `Info.plist`，`CFBundleIdentifier` 为 `com.antarxly.zembra`，应用名称为 `Zembra`。
- 2026-05-20：补充 `npm run package:macos` 打包脚本和 `docs/references/tauri-macos-packaging.md` 本机打包教程，覆盖测试、Web 构建、Tauri app bundle 和产物元数据核对。

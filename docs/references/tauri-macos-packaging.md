# Tauri macOS 本机打包教程

日期：2026-05-20

## 适用范围

本文档用于验收 R008 Tauri macOS App。本流程只覆盖本机开发可运行的 `Zembra.app`，不包含签名、公证、`.dmg`、自动更新、自定义图标或 backend sidecar。

## 前置条件

| 项目 | 要求 |
| --- | --- |
| Node.js | 能运行当前前端项目的 Node.js 和 npm |
| Rust | 已安装 `cargo` 和当前稳定 Rust toolchain |
| macOS 构建工具 | 已安装 Xcode Command Line Tools |
| 前端依赖 | 已执行 `npm install` |
| 后端服务 | Rust 后端已由用户单独启动 |

## 后端配置

桌面 app 不启动后端。验收前需要启动后端，并确认：

| 项目 | 要求 |
| --- | --- |
| 默认地址 | `http://127.0.0.1:3000` |
| 健康检查 | `GET /health` 可访问，返回状态码小于 500 |
| CORS Origin | 放行 Tauri dev 模式的 Vite origin 和打包后 WebView 的请求来源 |
| CORS Methods | 至少放行 `GET`、`POST`、`PUT` |
| CORS Headers | 至少放行 `Accept`、`Content-Type` |
| 敏感信息 | 后端日志不要输出 token、密码、service role key 等敏感值 |

如果 `curl http://127.0.0.1:3000/health` 成功，但 app 内提示不可达，优先检查后端 CORS 配置。

## 打包命令

推荐使用仓库脚本：

```bash
npm run package:macos
```

脚本会依次执行：

| 步骤 | 命令或动作 |
| --- | --- |
| 前端测试 | `npm test` |
| Web 构建 | `npm run build` |
| Tauri 打包 | `tauri build --bundles app` |
| 产物核对 | 检查 `CFBundleIdentifier` 和 `CFBundleName` |

产物路径：

```text
src-tauri/target/release/bundle/macos/Zembra.app
```

## 手动打包命令

如果只需要手动执行 Tauri 打包，可以运行：

```bash
npm run tauri:build
```

如果本机 npm 没有把 `tauri` 二进制暴露到 `node_modules/.bin`，可以使用同版本官方 CLI：

```bash
npm exec --offline --package @tauri-apps/cli@2.11.2 -- tauri build --bundles app
```

## 验收步骤

1. 启动外部 Rust 后端。
2. 运行 `npm run package:macos`。
3. 打开 `src-tauri/target/release/bundle/macos/Zembra.app`。
4. 在后端 URL 页面输入后端 host 和 port。
5. 确认 app 通过 `GET /health` 后进入首页。
6. 打开同步设置页，确认页面能继续通过配置的后端地址访问 API。

## 元数据检查

脚本会自动检查以下内容：

| 字段 | 预期值 |
| --- | --- |
| `CFBundleIdentifier` | `com.antarxly.zembra` |
| `CFBundleName` | `Zembra` |

也可以手动检查：

```bash
plutil -p src-tauri/target/release/bundle/macos/Zembra.app/Contents/Info.plist
```

## 常见问题

| 现象 | 处理 |
| --- | --- |
| `tauri: command not found` | 先运行 `npm install`；仍失败时使用 `npm exec --offline --package @tauri-apps/cli@2.11.2 -- tauri build --bundles app` |
| app 内提示后端不可达 | 先确认后端进程运行，再检查 `GET /health` 和 CORS |
| 构建耗时很久 | Tauri 首次 release 构建需要编译 Rust 依赖，后续会复用缓存 |
| macOS 拦截正式分发 | 当前版本未做签名和公证，只用于本机开发验收 |

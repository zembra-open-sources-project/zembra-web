# r005-light-theme-mode 设计文档

日期：2026-05-15

需求澄清文档：`docs/request-clarify/home-ui/r005-light-theme-mode.md`

## 核心功能

为当前 Web UI 增加主题系统，默认呈现浅色模式，同时保留现有深色视觉，并提供浅色、深色两种偏好切换。

## 设计目标

| 目标 | 说明 |
| --- | --- |
| 默认浅色 | 未保存偏好时使用浅色主题 |
| 保留深色 | 现有深色视觉作为 `dark` 主题保留 |
| 可记忆 | 用户选择写入 `localStorage` |
| 小范围改动 | 不引入新依赖，不改变数据层和路由结构 |

## 技术方案

### 主题状态

| 项 | 设计 |
| --- | --- |
| 类型 | `ThemePreference = "light" | "dark"` |
| 默认值 | `light` |
| 存储 key | `zembra-theme-preference` |
| DOM 标记 | 在 `document.documentElement` 写入 `data-theme="light"` 或 `data-theme="dark"` |

### 主题控制入口

| 位置 | 设计 |
| --- | --- |
| 首页 | 品牌栏右侧，与 Settings 按钮并列放置主题切换按钮 |
| 同步设置页 | Header 右侧，与状态 pill 并列放置主题切换按钮 |
| 控件形态 | 使用纯图标按钮，单击直接在 light 和 dark 之间切换 |

### CSS Token

| Token | 用途 |
| --- | --- |
| `--color-app-bg` | 页面背景 |
| `--color-surface` | 卡片、输入区、面板背景 |
| `--color-surface-muted` | 次级面板、输入背景 |
| `--color-border` | 默认边框 |
| `--color-border-strong` | 强调边框 |
| `--color-text-primary` | 主文本 |
| `--color-text-secondary` | 次文本 |
| `--color-text-muted` | 弱文本 |
| `--color-accent` | 主强调色 |
| `--color-accent-hover` | 强调 hover |
| `--color-accent-soft` | 强调弱背景 |
| `--color-shadow-card` | 卡片阴影 |
| `--color-shadow-float` | 悬浮层阴影 |

### 代码改动范围

| 文件 | 改动 |
| --- | --- |
| `src/styles/main.css` | 增加 light/dark token、基础 `color-scheme` 和按钮 active token |
| `src/app/theme.ts` | 新增主题偏好读写和下一主题计算工具 |
| `src/app/ThemeProvider.tsx` | 管理主题状态并写入 `data-theme` |
| `src/app/ThemeToggle.tsx` | 新增可复用主题切换控件 |
| `src/app/App.tsx` | 包裹 `ThemeProvider` |
| `src/pages/home/HomePage.tsx` | 将硬编码色值迁移到主题 token，接入主题切换控件 |
| `src/pages/settings/SyncSettingsPage.tsx` | 将硬编码色值迁移到主题 token，接入主题切换控件 |
| `src/app/BackendStatusToast.tsx` | 使用主题 token |

## 测试策略

| 类型 | 验证 |
| --- | --- |
| 单元测试 | 增加主题工具测试，覆盖默认浅色、保存偏好、点击切换目标 |
| 回归测试 | `npm run test` 通过 |
| 编译检查 | `npm run build` 通过 |
| 手工检查 | 浏览器访问 `/` 和 `/settings/sync`，确认浅色默认、深色切换和刷新记忆 |

## 风险控制

- 不改 API Client、store 或后端交互，降低功能回归风险。
- 主题色通过 CSS 变量集中定义，避免浅色模式散落在组件内部。
- 保留现有深色配色语义，减少视觉回退成本。

# r006-i18n-foundation

日期：2026-05-15

## 关联需求澄清

- `docs/request-clarify/i18n/r006-i18n-foundation.md`

## 核心功能（WHAT）

为 `zembra-web` 建立前端国际化基础设施，首批支持简体中文、繁体中文和英语。改造完成后，用户可以在应用内切换语言，核心 UI 文案、辅助功能文案、表单提示、状态反馈和日期展示会跟随当前语言变化。

### 需求背景（WHY）

当前项目已经具备首页、同步设置页、主题切换和 backend 连接提示等基础体验，但文案直接写在 React 组件里，且存在中英文混排。继续扩大功能后再国际化会增加迁移成本，也会让开发过程缺少“新增文案必须进语言资源”的约束。

### 需求目标（GOAL）

- 建立 `i18next + react-i18next` 的应用级 i18n 底座。
- 提供 `zh-CN`、`zh-TW`、`en-US` 三套语言资源。
- 让核心页面不再直接写死 UI 壳文案。
- 统一语言偏好读取、持久化和 HTML `lang` 同步逻辑。
- 将 `en-US` 作为 i18next 缺失翻译的默认回退语言。
- 为后续新增页面提供稳定的翻译 key、目录结构和测试模式。

### 范围边界

| 类型 | 内容 |
| --- | --- |
| 包含 | i18n 初始化、语言资源、语言选择入口、首页文案、同步设置页文案、全局 toast、主题切换、日期格式、相关测试 |
| 不包含 | 用户内容翻译、后端错误翻译、URL locale 路由、SEO 多语言能力、远程文案系统、数据库或同步协议改动 |

## 实现流程（HOW）

### 架构设计

| 层级 | 设计 |
| --- | --- |
| 初始化层 | 在 `src/i18n/index.ts` 初始化 `i18next`，注册 `initReactI18next`，关闭 Suspense 或显式保证同步资源加载 |
| 资源层 | 在 `src/i18n/locales/{locale}/` 下维护模块化语言资源，由 `resources.ts` 聚合 |
| 类型层 | 在 `src/i18n/types.ts` 定义支持语言、语言展示名和默认语言 |
| 偏好层 | 在 `src/i18n/locale.ts` 封装读取、规范化、持久化和 `document.documentElement.lang` 同步 |
| React 接入 | 在应用根部完成初始化后使用 `useTranslation`，组件内通过 namespace 获取文案 |
| UI 入口 | 新增 `LanguageToggle` 或 `LanguageMenu`，放在顶部工具区，与 `ThemeToggle` 并列 |

### 目录结构

```text
src/i18n/
  index.ts
  locale.ts
  resources.ts
  types.ts
  locales/
    zh-CN/
      common.ts
      home.ts
      settings.ts
    zh-TW/
      common.ts
      home.ts
      settings.ts
    en-US/
      common.ts
      home.ts
      settings.ts
```

### 命名空间规划

| Namespace | 用途 | 示例范围 |
| --- | --- | --- |
| `common` | 应用壳与通用操作 | 主题切换、语言切换、全局 toast、通用状态 |
| `home` | 首页工作台 | 统计项、侧边栏、搜索、输入框、空状态、展开收起 |
| `settings` | 设置页 | 同步设置标题、表单、按钮、结果、状态面板 |

### 关键接口

| 标识 | 说明 |
| --- | --- |
| `SupportedLocale` | 受支持语言枚举：`zh-CN`、`zh-TW`、`en-US` |
| `defaultLocale` | 默认展示语言：`zh-CN` |
| `fallbackLocale` | 默认回退语言：`en-US` |
| `normalizeLocale(input)` | 将浏览器语言或持久化值归一到受支持语言 |
| `readStoredLocale()` | 从 `localStorage` 读取语言偏好 |
| `persistLocale(locale)` | 保存语言偏好 |
| `syncDocumentLocale(locale)` | 同步 HTML `lang` 属性 |

### UI 触点

| 文件 | 改造点 |
| --- | --- |
| `src/app/App.tsx` | 接入 i18n 初始化与语言偏好副作用 |
| `src/app/ThemeToggle.tsx` | 主题按钮 `aria-label` 和 `title` 使用翻译 |
| `src/app/BackendStatusToast.tsx` | backend 连接失败提示使用翻译 |
| `src/pages/home/HomePage.tsx` | 首页可见文案、placeholder、aria-label、日期格式使用翻译 |
| `src/pages/settings/SyncSettingsPage.tsx` | 设置页文案、校验文案、状态文案、按钮文案、日期格式使用翻译 |

## i18n

### Locale 映射

| 展示语言 | Locale | HTML lang |
| --- | --- | --- |
| 简体中文 | `zh-CN` | `zh-CN` |
| 繁體中文 | `zh-TW` | `zh-TW` |
| English | `en-US` | `en-US` |

### 回退策略

| 场景 | 策略 |
| --- | --- |
| 无持久化语言 | 优先匹配 `navigator.language`，无法匹配则使用 `zh-CN` |
| 浏览器语言为 `zh-HK`、`zh-MO` | 归一到 `zh-TW` |
| 浏览器语言为其他 `zh-*` | 归一到 `zh-CN` |
| 浏览器语言为 `en-*` | 归一到 `en-US` |
| 缺失 key | 回退到 `en-US`，并在测试中覆盖关键页面资源完整性 |

### Key 设计

| Namespace | Key 示例 | 参数 |
| --- | --- | --- |
| `common` | `theme.switchToLight` | 无 |
| `common` | `backend.connectionFailed` | 无 |
| `common` | `language.label` | 无 |
| `home` | `stats.notes` | 无 |
| `home` | `composer.saveTo` | `field` |
| `home` | `note.expand` | 无 |
| `settings` | `sync.title` | 无 |
| `settings` | `form.interval.errorPositiveInteger` | 无 |
| `settings` | `results.manualSyncSummary` | `pushed`、`pulled` |

### 文案处理规则

- 固定 UI 文案进入语言资源。
- 动态业务数据保持原样展示，例如用户笔记、标签、Field 名、workspace id、device id。
- 后端错误信息第一阶段保持原样，后续如需翻译应由错误码驱动，不按字符串匹配。
- `aria-label`、`title`、placeholder 和空状态同样必须走翻译资源。
- 包含变量的文案必须使用 i18next interpolation，避免组件内拼接整句。

## 测试用例

### 编译检查

- 运行 `npm run build`，确认 TypeScript 和 Vite 构建通过。

### 自动化回归

- 运行 `npm run test`，确认现有组件测试通过。
- 新增或更新语言偏好测试，覆盖默认语言、浏览器语言归一、持久化读取。
- 更新首页和设置页测试，覆盖关键文案在默认语言下可见。
- 新增语言切换组件测试，确认切换后 UI 文案变化。

### 手工检查

- 打开首页，分别切换简体中文、繁体中文、英语，检查布局没有明显溢出。
- 打开同步设置页，检查表单 label、按钮、状态面板和校验信息随语言变化。
- 触发 backend 连接失败 toast，确认提示文案随语言变化。
- 检查 HTML `lang` 属性与当前语言一致。

# r015-settings-modal-supabase-section 设计文档

日期：2026-05-28

需求澄清文档：`docs/request-clarify/sync/r015-settings-modal-supabase-section.md`

## 核心功能（WHAT）

将当前独立的 Supabase 同步配置页重构为全局 Settings popup 中的 Supabase section。Settings 中只承担配置和测试职责，手动同步动作移动到首页。

### 需求背景（WHY）

同步配置属于应用偏好设置，不应该作为独立工作台承载。当前页面把配置、状态、启用、手动运行混在一起，导致按钮布局和交互语义持续冲突。新的 Settings modal 结构可以把“配置”与“运行同步”分离，让 Supabase 配置成为设置体系中的一个稳定 section。

### 需求目标（GOAL）

| 目标 | 设计结论 |
| --- | --- |
| 设置入口 | 首页 Settings 入口打开 modal，而不是进入独立 Supabase Sync 页面。 |
| Supabase section | Settings modal 内放置 Supabase section，用于同步连接配置。 |
| 启用同步 | 使用 switch 表达真实启用状态，避免伪表单草稿开关。 |
| 配置动作 | section 内只保留 `Test` 和 `Save`。 |
| 手动同步 | `Sync` 放回首页，不出现在 Settings modal。 |
| Secret 命名 | UI 文案使用 `Secret key`，不显示 `service role key`。 |

### 范围边界

| In Scope | Out of Scope |
| --- | --- |
| Settings modal 框架 | 不做完整偏好设置产品体系 |
| Supabase section 布局 | 不展示 sync cursor 详情 |
| Enable sync switch | 不引入 Supabase SDK |
| Test / Save 配置动作 | 不改后端 `/sync/*` 契约 |
| 首页 Sync 入口 | 不做同步历史工作台 |

## 实现流程（HOW）

### 页面结构

Settings modal 使用居中弹窗布局，外层负责遮罩、弹窗宽度和关闭行为；内部使用 section 列表组织设置项。

```text
Settings Modal
├─ Header
│  ├─ Title: Settings
│  └─ Close button
└─ Sections
   └─ Supabase
      ├─ Enable sync switch
      ├─ Supabase URL input
      ├─ Secret key input
      ├─ Interval seconds input
      └─ Actions: Test / Save
```

首页继续作为主要工作界面，并提供手动同步入口：

```text
Home toolbar/sidebar
├─ Settings
└─ Sync
```

### 状态归属

| 状态 | 归属 |
| --- | --- |
| Settings modal open/close | App 或首页局部状态 |
| Supabase config | Settings modal 内部 state，从 `syncClient.getConfig()` 初始化 |
| Enable sync | switch 真实表达后端启用状态，切换时调用后端更新或进入保存流程前需另行实现细节确认；不得表现为不会生效的草稿开关 |
| Test result | Supabase section 局部反馈 |
| Save result | Supabase section 局部反馈 |
| Manual sync result | 首页同步入口附近或全局 toast，不属于 Settings modal |

### API 使用

沿用现有 `src/api/sync.client.ts`：

| 动作 | API |
| --- | --- |
| 读取配置 | `GET /sync/config` |
| 测试配置 | `POST /sync/config/test` |
| 保存配置 | `PUT /sync/config` |
| 首页手动同步 | `POST /sync/run` |

字段继续按最新 OpenAPI 使用 `secret_key` 和 `secret_key_configured`，但 UI 不展示 secret configured 状态文案。

### UI 布局

Supabase section 使用设置项行布局，而不是表单工作台布局：

```text
┌──────────────────────────────────────────────┐
│ Settings                                  X  │
│                                              │
│ Supabase                                     │
│ ┌──────────────────────────────────────────┐ │
│ │ Enable sync                         [●] │ │
│ │ Supabase URL                            │ │
│ │ [https://project.supabase.co          ] │ │
│ │ Secret key                              │ │
│ │ [Leave blank to keep existing secret  ] │ │
│ │ Interval seconds                  [60] │ │
│ │                                          │ │
│ │                              [Test][Save]│ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

布局约束：

- Modal 宽度使用响应式上限，避免占满整个页面。
- Section 内输入控件对齐，保持设置面板的密度。
- `Test` 和 `Save` 为配置动作，放在 Supabase section 底部右侧。
- `Sync` 不进入 modal。
- 不使用 `service role key`、`role key` 文案。

### 错误和反馈

| 场景 | 处理 |
| --- | --- |
| Test 成功 / 失败 | 在 Supabase section 内展示短反馈。 |
| Save 成功 / 失败 | 在 Supabase section 内展示短反馈。 |
| Enable sync 切换失败 | switch 回滚到后端真实状态，并展示错误。 |
| Secret key 为空 | 按后端现有语义处理；若留空代表保留已有 secret，文案需明确。 |
| Manual Sync 失败 | 首页同步入口附近或全局 toast 展示，不进入 Settings modal。 |

## i18n

| Key | en-US | zh-CN | zh-TW |
| --- | --- | --- | --- |
| `settings.title` | Settings | 设置 | 設定 |
| `settings.close` | Close | 关闭 | 關閉 |
| `settings.supabase.title` | Supabase | Supabase | Supabase |
| `settings.supabase.enableSync` | Enable sync | 启用同步 | 啟用同步 |
| `settings.supabase.url` | Supabase URL | Supabase URL | Supabase URL |
| `settings.supabase.secretKey` | Secret key | Secret key | Secret key |
| `settings.supabase.intervalSeconds` | Interval seconds | 同步间隔秒数 | 同步間隔秒數 |
| `settings.actions.test` | Test | 测试 | 測試 |
| `settings.actions.save` | Save | 保存 | 儲存 |
| `home.actions.sync` | Sync | 同步 | 同步 |

## 测试用例

### 编译检查

| 用例 | 预期 |
| --- | --- |
| `npm run build` | TypeScript 和 Vite 构建通过。 |

### 单元测试

| 用例 | 预期 |
| --- | --- |
| Settings modal 打开关闭 | 首页 Settings 入口打开 modal，关闭按钮关闭 modal。 |
| Supabase 配置加载 | Modal 打开后展示后端配置。 |
| Enable sync switch | 切换时表达真实启用状态，失败时回滚并展示错误。 |
| Test action | 调用 `syncClient.testConfig`，不保存配置。 |
| Save action | 调用 `syncClient.updateConfig`，不触发手动同步。 |
| 首页 Sync action | 调用 `syncClient.runSync`，不依赖 Settings modal。 |

### 手工检查

| 用例 | 预期 |
| --- | --- |
| Settings 视觉 | Modal 类似偏好设置 popup，Supabase 只是一个 section。 |
| 文案检查 | UI 不出现 `service role key` 或 `role key`。 |
| 动作边界 | Settings 内只看到 Test / Save，首页可看到 Sync。 |
| 响应式检查 | Modal 在桌面和窄屏下不出现按钮重叠、文字裁切或横向失控。 |

### 回归检查

| 用例 | 预期 |
| --- | --- |
| 笔记首页 | 首页笔记浏览、编辑和设置入口不受影响。 |
| API client | 现有 sync client 字段映射测试继续通过。 |
| i18n | 英文、简体中文、繁体中文资源完整。 |

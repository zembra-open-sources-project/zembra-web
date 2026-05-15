# r005-light-theme-mode 需求澄清

日期：2026-05-15

## 需求结论

为当前 Web UI 增加浅色模式，并将浅色作为默认主题。主题能力覆盖首页 `/`、同步设置页 `/settings/sync` 和全局 backend 连接失败 Toast。

## 已确认范围

| 类型 | 内容 |
| --- | --- |
| In Scope | 默认使用浅色主题 |
| In Scope | 支持浅色、深色两种主题偏好 |
| In Scope | 支持页面内通过纯图标按钮单击切换主题 |
| In Scope | 使用 `localStorage` 记忆用户选择 |
| In Scope | 首页、同步设置页、全局 Toast 适配浅色与深色 |
| Out of Scope | 新增 UI 组件库或主题依赖 |
| Out of Scope | 后端接口、数据模型、同步逻辑变更 |
| Out of Scope | UI 自动化测试 |

## 体验要求

- 首次访问时默认呈现浅色主题。
- 用户手动切换浅色或深色后，下次访问保持该选择。
- 主题控件不显示文字，使用图标和 accessible label 表达当前切换动作。
- 主题切换不改变现有页面布局、数据加载和交互行为。

## 验收标准

- 首次加载 `/` 时页面为浅色。
- 点击主题按钮后，首页、设置页和 Toast 在浅色与深色之间切换。
- 刷新页面后保留上一次选择。
- `npm run test` 和 `npm run build` 通过。

# r015-settings-modal-supabase-section 需求澄清

日期：2026-05-28

## 背景

当前 Supabase 同步配置以独立 `/settings/sync` 页面承载，页面中同时出现配置、测试、启用、手动同步和状态展示，导致设置页面视觉重量过高、动作边界混乱。新需求将其重构为全局 Settings 弹窗中的一个 Supabase 配置 section。

## 需求理解

Settings 应以 popup/modal 形式出现，类似偏好设置面板。Supabase 不再作为独立大页面，而是 Settings 中的一个 section。该 section 只负责连接配置、启用状态配置和连接测试；手动同步动作移到首页。

## 已确认结论

| 项目 | 结论 |
| --- | --- |
| Settings 形态 | 使用弹窗 / popup / modal，而不是独立同步工作台页面。 |
| Supabase 定位 | Supabase 只是 Settings 里的一个 section。 |
| 字段命名 | 使用 `Secret key`，不再出现 `service role key` 或 `role key` 概念。 |
| Secret 状态 | 不显示 `Service role key: Configured / Not configured`。 |
| 启用同步 | 使用滑块 switch，表达真实启用状态；不能做成“表单草稿，Save 后才生效”的伪开关。 |
| Settings 内动作 | 只保留 `Test` 和 `Save`。 |
| 手动同步 | `Sync` 从 Settings 移到首页。 |
| API 边界 | 不引入 Supabase SDK，不改后端契约。 |

## 范围

- 新增或改造全局 Settings modal。
- 将 Supabase 配置作为 Settings modal 中的 section。
- Supabase section 包含 Enable sync switch、Supabase URL、Secret key、Interval seconds、Test、Save。
- 首页提供手动 `Sync` 入口。
- 移除 Settings 中的 `Sync` 手动运行入口。
- 移除 Settings 中的 `Save & Enable Sync`。
- 文案和 i18n 更新为新版 API 语义。

## 不做范围

- 不新增 Supabase SDK。
- 不改后端 `/sync/*` API 契约。
- 不做完整多分类设置系统，只为当前 Settings modal 建立可扩展结构。
- 不展示 sync cursor 详情，除非后续需求单独确认。

## 验收标准

- 用户从首页进入 Settings popup 后，可以在 Supabase section 配置同步连接。
- `Enable sync` switch 的交互语义清晰，直接代表真实启用状态。
- Settings 内只出现 `Test` 和 `Save` 配置动作。
- 首页能找到手动 `Sync` 动作。
- UI 中不再出现 `service role key` / `role key` 文案。
- 配置仍通过前端 API Client 访问后端，不让 UI 直接依赖 Supabase 实现。

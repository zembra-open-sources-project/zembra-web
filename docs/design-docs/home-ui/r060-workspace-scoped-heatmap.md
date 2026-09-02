# r060-workspace-scoped-heatmap 设计文档

日期：2026-09-01

## 方案

复用 `DailyNotesHeatmap`、现有 notes store 和 `NotesClient`，不新增数据层或布局状态。首页将当前 `workspace.id` 传给热力图组件；热力图在已计算出可容纳的日数后，把工作区标识作为统计加载副作用的依赖。工作区切换时，组件使用已有的日数重新调用 `loadDailyNoteCounts`，而运行时已激活的 workspace-scoped client 会返回新工作区对应的连续每日统计。

热力图列数继续且仅继续由侧栏宽度、`--heatmap-cell-size` 与 `--heatmap-cell-gap` 计算。切换 workspace 不重置、不调整、不重新定义列数；无笔记 workspace 返回同样数量且计数均为 0 的日期格，展示为空白级别。

## 验证

新增组件回归测试，验证切换 workspace 会以相同的日数重新加载统计，确保不因切换改变网格范围。运行完整测试以及 Backend、Supabase 两种生产构建。

# r060-workspace-scoped-heatmap 执行计划

日期：2026-09-01

## 实施结果

已完成热力图 workspace 绑定：`HomePage` 向 `DailyNotesHeatmap` 传入当前 `workspace.id`，热力图在 workspace 切换后以已存在的日数重新加载每日统计。列数计算仍只受侧栏宽度和 heatmap 尺寸 token 控制，工作区切换不会改变网格列数或日期范围；新工作区没有笔记时，既有数量的格子按 0 计数显示为空白。

## 验证记录

`npm test` 通过：22 个测试文件、141 项测试全部通过。新增测试覆盖 workspace 切换前后请求日数同为 105。`npm run build:backend` 与 `npm run build:supabase` 均通过，所有 JavaScript 产物均低于 500 kB gzip 阈值。`git diff --check` 通过。

## 状态

等待用户验收。

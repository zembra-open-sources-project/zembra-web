# r010-daily-note-heatmap 需求澄清

日期：2026-05-21

## 需求理解

本次需求是在首页左侧的活跃热力图位置，用后端已经提供的每日笔记数接口替换当前静态占位。热力图展示最近 30 天日历日期，每一天根据当天笔记数量显示不同强度颜色。

## 接口确认

已在本地后端 `http://127.0.0.1:3000` 确认 OpenAPI 和接口返回。

| 项目 | 结论 |
| --- | --- |
| OpenAPI | `GET /api-docs/openapi.json` |
| 统计接口 | `GET /notes/stats/daily-counts` |
| 响应结构 | `{ days: [{ date: "YYYY-MM-DD", count: number }] }` |
| 排序 | 日期升序 |
| 时间范围 | 过去 30 天 |

## 范围边界

| 类型 | 内容 |
| --- | --- |
| In Scope | 在 API Client 增加每日笔记数读取能力 |
| In Scope | notes store 加载并保存 30 天每日统计 |
| In Scope | 首页热力图从占位格改为日历+热力显示 |
| In Scope | 热力格包含可访问标签和 hover title |
| In Scope | 新建和编辑笔记成功后刷新热力图统计 |
| In Scope | 补充 i18n 文案和自动化测试 |
| Out of Scope | 点击某天筛选 note feed |
| Out of Scope | 日期详情弹窗 |
| Out of Scope | 改造移动端侧栏展示 |

## 验收标准

- 首页桌面侧栏显示最近 30 天日历热力图。
- 热力格日期来自 `GET /notes/stats/daily-counts`，不再使用静态占位数组。
- 当接口返回非零 count 时，对应日期显示更高热力颜色。
- 新建或编辑笔记成功后会刷新热力图统计。
- `npm run test` 和 `npm run build` 通过。

# r010-daily-note-heatmap 设计文档

日期：2026-05-21

需求澄清文档：`docs/request-clarify/home-ui/r010-daily-note-heatmap.md`

## 核心功能

将首页左侧热力图占位替换为真实的 30 天日历热力图。数据来自后端 `GET /notes/stats/daily-counts`，前端按日期升序渲染，并根据每日 count 计算颜色等级。

## API 契约

| 项目 | 设计 |
| --- | --- |
| Endpoint | `GET /notes/stats/daily-counts` |
| Response | `DailyNoteCountsResponse` |
| 字段 | `days: DailyNoteCount[]` |
| 日期 | `date` 使用 `YYYY-MM-DD` |
| 计数 | `count` 为当天可见 note 创建数量 |

## 前端设计

| 文件 | 改动 |
| --- | --- |
| `src/api/types.ts` | 新增 `DailyNoteCount` 与 `DailyNoteCountsResponse` |
| `src/api/notes.client.ts` | `NotesClient` 新增 `listDailyNoteCounts()` |
| `src/features/notes/noteStore.ts` | 新增 `dailyNoteCounts` 状态与 `loadDailyNoteCounts()` action |
| `src/pages/home/HomePage.tsx` | 用 `DailyNotesHeatmap` 渲染真实日历热力图 |
| `src/i18n/locales/*/home.ts` | 更新热力图可访问文案和空态文案 |

## 热力等级

颜色等级在 UI 层根据当前 30 天最大 count 计算，避免后端承担表现层逻辑。

| count | level |
| --- | --- |
| `0` | `0` |
| `> 0` 且处于最大值 25% 以内 | `1` |
| `> 25%` 且处于最大值 50% 以内 | `2` |
| `> 50%` 且处于最大值 75% 以内 | `3` |
| `> 75%` | `4` |

## 布局设计

热力图仍归属首页左侧栏。侧栏负责可用宽度，热力图组件负责标题、星期标签、日期格和月份边界文案。日期格使用稳定尺寸，不参与撑开侧栏。

## 风险控制

- 不新增依赖。
- UI 只消费 API Client DTO，不直接依赖数据库表。
- 测试覆盖接口路径、store 状态和首页渲染，防止回到静态占位。

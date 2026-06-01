# r015-hierarchical-tags-sidebar 执行计划

日期：2026-06-01

## 关联设计文档

- 需求澄清文档：`docs/request-clarify/home-ui/r015-hierarchical-tags-sidebar.md`
- 设计文档：`docs/design-docs/home-ui/r015-hierarchical-tags-sidebar.md`

## Stage #1: API 与 Tag 工具模型

### 任务 #1: 扩展结构化 tag API 类型

**Status:** Finished

**Files:** Modify `src/api/types.ts`, Modify `src/api/taxonomy.client.ts`, Modify `src/api/taxonomy.client.test.ts`

**Function:** 让前端 API 边界消费后端 v0.4 的结构化 tag 字段，并保留完整 path 作为 UI 筛选和展示的稳定标识。

**Implementation Notes:** `TagRecord` 增加 `parent_tag_id?: string | null`、`path: string`、`depth: number`；`TagDto` 增加 `parentTagId?: string`、`path: string`、`depth: number`。`mapTagRecordToDto()` 将 snake_case 映射为 camelCase，`parent_tag_id: null` 映射为 `undefined`。`createMockTaxonomyClient()` 中的 mock tag 补齐 `path` 和 `depth`，避免测试继续依赖旧平铺结构。

**Expected Verification Result:** `npm run test -- src/api/taxonomy.client.test.ts` 通过；测试覆盖 root tag、child tag、null parent 和 `/tags?all=true` 返回结构化 tag 列表。

### 任务 #2: 增加二级 tag 解析、格式化和筛选工具

**Status:** Finished

**Files:** Modify `src/pages/home/homeUtils.ts`, Modify `src/pages/home/homeUtils.test.ts`

**Function:** 提供二级 tag 输入解析、路径展示、树构建和父子筛选能力。

**Implementation Notes:** 保持 `parseTagNames()` 返回完整 path，补充 `#books/hands-on-gpt` 测试。新增或拆分工具函数用于：格式化 `books/hands-on-gpt` 为清晰路径标签；构建二级 tag tree；查找 selected child 的 parent；判断 note tags 是否匹配 selected tag path。父 tag 匹配 `root` 和 `root/*`，子 tag 精确匹配完整 path。工具函数只支持本轮二级语义，不实现任意深度递归 UI。

**Expected Verification Result:** `npm run test -- src/pages/home/homeUtils.test.ts` 通过；测试覆盖解析、正文 marker 移除、root-child 树构建、孤儿 child 兜底、父子筛选差异。

## Stage #2: Sidebar Tags 二级树交互

### 任务 #3: 改造 Tags sidebar 为可折叠二级树

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.tsx`, Modify `src/pages/home/HomeSidebar.tsx`, Modify `src/i18n/locales/zh-CN/home.ts`, Modify `src/i18n/locales/zh-TW/home.ts`, Modify `src/i18n/locales/en-US/home.ts`

**Function:** 将 HomePage 的 Tags section 从平铺 `tags.map()` 改为 root-child 二级树，支持展开、折叠、父标签子树筛选和子标签精确筛选。

**Implementation Notes:** `HomePage` 根据 `tags` 和 `tagUsage` 生成二级树，`selectedTag` 继续保存完整 path。新增本地 `expandedTagRoots` 状态；初始未选 tag 不展开全部，选中 child tag 时展开 parent root。父 row 主点击区域调用 `setSelectedTag(rootPath)`，再次点击同一 path 可沿用现有 toggle 语义清空；子 row 点击 `setSelectedTag(childPath)`。有 child 的 root row 提供独立折叠按钮和本地化 `aria-label`。`HomeSidebar` 可新增专用 tag tree row 组件，或在不破坏 Roles/Fields 的前提下扩展现有 `NavItem`。

**Expected Verification Result:** HomePage UI 测试能看到 root tag；默认不展开未选中的 child；点击展开按钮后显示 child；点击父 tag 后 feed 包含父子树 notes；点击 child 后 feed 只包含该完整 path note。

### 任务 #4: 更新 Note Card tag chip 路径展示

**Status:** Finished

**Files:** Modify `src/pages/home/NoteCard.tsx`, Modify `src/pages/home/homeUtils.ts`, Modify `src/pages/home/HomePage.test.tsx`

**Function:** note card 中二级 tag chip 使用清晰层级路径表达，正文中的 inline tag marker 不重复展示。

**Implementation Notes:** 渲染 tag chip 时使用格式化 helper 或小组件，把 `books/hands-on-gpt` 展示为 `#books > hands-on-gpt` 或 icon 连接。保留单级 tag 的 `#inbox` 形态。`stripRenderedTagMarkers()` 继续用完整 path 匹配正文中的 `#books/hands-on-gpt`，保证 note body 不重复显示 marker。测试验证可见文本和 marker 移除行为，不断言 chip 的颜色、尺寸、间距或 Tailwind class。

**Expected Verification Result:** HomePage 测试能断言二级 tag chip 展示为清晰路径表达，且正文不再重复出现原始 `#books/hands-on-gpt` marker。

## Stage #3: 回归测试与计划回写

### 任务 #5: 补充端到端行为覆盖

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.test.tsx`, Modify `src/i18n/resources.test.ts`

**Function:** 覆盖创建、编辑、sidebar 树交互、父子筛选和 i18n 完整性。

**Implementation Notes:** 创建和编辑测试要断言提交 payload 的 `tags` 包含 `books/hands-on-gpt`。Sidebar 测试通过 store 预置 root/child tags 与 notes，验证默认展开策略、展开按钮、父 tag 子树筛选、child 精确筛选。i18n 测试沿用现有资源完整性检查，确保新增 key 三种语言都存在。

**Expected Verification Result:** `npm run test -- src/pages/home/HomePage.test.tsx src/i18n/resources.test.ts` 通过；测试只验证用户可观察行为、语义结构、请求输入和状态变化。

### 任务 #6: 执行整体验证并回写计划

**Status:** Finished

**Files:** Modify `docs/exec-plans/active/home-ui/r015-hierarchical-tags-sidebar.md`

**Function:** 运行自动化测试和构建，记录实现进度、验证命令和结果。

**Implementation Notes:** 开发完成后运行 `npm run test` 和 `npm run build`。完成每个 Stage 后，如果修改了代码，按项目规则进行一次 git commit。commit message 必须通过仓库 Git Commit 防火墙，例如 `feat: add hierarchical tag sidebar tree`。

**Expected Verification Result:** `npm run test` 和 `npm run build` 通过；执行计划中的任务状态和开发记录已更新。

## 开发记录

- 2026-06-01：已完成需求澄清、设计文档和执行计划。实现范围确认：web UI 只支持二级 tag；创建/编辑继续提交完整 path；sidebar Tags 使用可折叠二级树；父 tag 筛选整个子树；默认只展开当前选中 tag 所在父节点；note chip 使用更清晰路径展示。
- 2026-06-01：已完成 Stage #1，扩展 `TagRecord`/`TagDto` 接收 `parent_tag_id`、`path`、`depth` 并更新 taxonomy client 映射；新增二级 tag path 解析、格式化、树构建、父子筛选和选中 root 查找工具。`npm run test -- src/api/taxonomy.client.test.ts src/pages/home/homeUtils.test.ts` 通过。
- 2026-06-01：已完成 Stage #2，Tags sidebar 改为二级折叠树，父 tag 筛选整个子树、child tag 精确筛选，note card tag chip 改为 `#root > child` 路径展示，并补充 HomePage/i18n 行为测试。`npm run test -- src/pages/home/HomePage.test.tsx src/i18n/resources.test.ts` 和 `npm run build` 通过。
- 2026-06-01：已完成 Stage #3，执行全量回归验证并回写计划状态。`npm run test` 通过 14 个测试文件 85 个测试，`npm run build` 通过。

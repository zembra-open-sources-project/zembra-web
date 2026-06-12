# r017-note-card-markdown-rendering 开发计划

## 关联设计文档

- 需求澄清文档：`docs/request-clarify/home-ui/r017-note-card-markdown-rendering.md`
- 设计文档：`docs/design-docs/home-ui/r017-note-card-markdown-rendering.md`

## Stage #1: Markdown renderer 依赖与组件边界

### 任务 #1: 引入 GFM Markdown renderer 依赖

**Status:** Designed

**Files:** Modify `package.json`, Modify `package-lock.json`

**功能:** 添加 `react-markdown` 与 `remark-gfm`，为 NoteCard 展示态提供成熟 GFM renderer。

**实现说明:** 使用 npm 安装生产依赖。禁止引入 `rehype-raw`、语法高亮库、富文本编辑器或重型 UI 套件。安装后核对 lockfile 中没有数据库、ORM、migration、Supabase 查询类依赖。

**预期验证结果:** `package.json` dependencies 出现 Markdown renderer 相关依赖；lockfile 正常更新；没有新增禁止类依赖。

### 任务 #2: 拆出 NoteMarkdownContent 展示组件

**Status:** Designed

**Files:** Create `src/pages/home/NoteMarkdownContent.tsx`, Modify `src/pages/home/NoteCard.tsx`

**功能:** 将 NoteCard 展示态正文从 `<p>` 普通文本渲染替换为独立 Markdown 展示组件。

**实现说明:** `NoteCard` 继续负责 displayContent 计算、编辑态、操作菜单和折叠状态。展示态容器从 `HTMLParagraphElement` 调整为 `HTMLDivElement`，`contentRef` 仍用于测量折叠溢出。`NoteMarkdownContent` 接收 `content` 与 `onLoadNotePreview`，内部使用 `react-markdown` 和 `remark-gfm`。

**预期验证结果:** NoteCard 职责没有继续膨胀；编辑态保持原始 textarea；展示态由 Markdown 组件负责渲染。

### 任务 #3: 保留 Zembra 双链预览能力

**Status:** Designed

**Files:** Modify `src/pages/home/NoteCard.tsx`, Modify `src/pages/home/NoteMarkdownContent.tsx`, Verify `src/pages/home/homeUtils.ts`

**功能:** `[[note_ref]]` 在 Markdown 内容中继续渲染为短链按钮，并保留 hover / focus preview。

**实现说明:** 复用 `parseRenderableNoteContent()` 和 `formatShortNoteRef()`，只在 Markdown text 节点中替换 `[[32位hex]]` token。`NoteLinkPreview` 可从 `NoteCard.tsx` 提升导出，或迁移到 `NoteMarkdownContent.tsx` 附近，保持行为和 aria label 不变。

**预期验证结果:** `[[abcdef...]]` 展示为 `abcdef` 按钮；完整 note ref 不直接显示；hover 仍能加载目标 note preview。

## Stage #2: Markdown 节点策略与样式

### 任务 #1: 配置 Markdown 组件映射

**Status:** Designed

**Files:** Modify `src/pages/home/NoteMarkdownContent.tsx`

**功能:** 定义链接、行内代码、代码块、列表、引用、表格和任务列表的展示行为。

**实现说明:** `a` 节点统一设置 `target="_blank"` 与 `rel="noreferrer"`；inline `code` 使用卡片内行内高亮样式；block code 按普通 `pre > code` 展示，不引入语法高亮；table 外层使用横向滚动容器；task list checkbox 只读展示。

**预期验证结果:** GFM 常用结构具备语义化 DOM；外链行为符合需求；代码块没有语法高亮依赖。

### 任务 #2: 补充 Markdown 内容样式

**Status:** Designed

**Files:** Modify `src/styles/main.css`, Modify `src/pages/home/NoteMarkdownContent.tsx`

**功能:** 让 Markdown 子节点在 NoteCard 内保持可读、紧凑和响应式稳定。

**实现说明:** 优先使用 Tailwind class 和现有 CSS token；如需要全局选择器，集中到 `.note-markdown` 下。禁止新增嵌套卡片式样式。列表、引用、表格、代码的间距不能改变卡片宽度；表格需要内部横向滚动。

**预期验证结果:** Markdown 内容在桌面与移动宽度下不溢出卡片；文本与按钮不重叠；视觉语言与现有 NoteCard 一致。

### 任务 #3: 保持 tag / field marker 去重和折叠逻辑

**Status:** Designed

**Files:** Modify `src/pages/home/NoteCard.tsx`, Verify `src/pages/home/homeUtils.ts`

**功能:** Markdown 渲染前继续移除已独立展示的 `@field` 与 `#tag`，并保持折叠 / 展开可用。

**实现说明:** 继续使用现有 `stripRenderedTagMarkers()` 与 `stripRenderedFieldMarker()` 计算 `displayContent`。`contentRef` 绑定 Markdown 外层容器。`useLayoutEffect` 依赖仍跟随 `displayContent`、`fieldName`、`note.tags` 和 measurement callback。

**预期验证结果:** tag chip 和 field metadata 仍展示；正文不重复出现对应 marker；长 Markdown 内容能显示 Expand / Collapse。

## Stage #3: 测试与验证

### 任务 #1: 增加 Markdown 渲染行为测试

**Status:** Designed

**Files:** Modify `src/pages/home/HomePage.test.tsx`

**功能:** 覆盖 GFM 常用语义、链接安全、HTML 禁用、行内代码和双链回归。

**实现说明:** 使用 Testing Library 断言用户可观察行为和语义角色，例如 `list` / `listitem`、link 的 `target` 与 `rel`、`code` 节点存在、HTML 输入不生成真实 HTML 节点。不要断言 Tailwind class、颜色、尺寸、间距或固定样式值。

**预期验证结果:** 测试能证明 Markdown 渲染不是针对当前截图特判；双链 preview 旧测试继续通过。

### 任务 #2: 运行自动化验证

**Status:** Designed

**Files:** Verify `src/pages/home/HomePage.test.tsx`, Verify `src/pages/home/homeUtils.test.ts`, Verify `package.json`

**功能:** 确认测试、类型检查和构建通过。

**实现说明:** 运行 `npm run test` 和 `npm run build`。如果新增依赖安装或构建出现环境问题，记录具体错误并先定位根因，不跳过验证。

**预期验证结果:** `npm run test` 通过；`npm run build` 通过。

### 任务 #3: 浏览器手工回归检查

**Status:** Designed

**Files:** Verify `http://localhost:5173/`

**功能:** 在真实页面确认 Markdown 渲染和 NoteCard 交互。

**实现说明:** 启动或复用 Vite dev server，使用浏览器检查包含列表、外链、行内代码、双链和长内容的 note card。确认折叠 / 展开、hover preview、编辑态原始文本和卡片布局稳定。

**预期验证结果:** 浏览器中 NoteCard 正确展示 GFM；外链新窗口策略存在；双链预览可用；没有明显溢出或重叠。

### 任务 #4: 回写计划状态并提交

**Status:** Designed

**Files:** Modify `docs/exec-plans/active/home-ui/r017-note-card-markdown-rendering.md`

**功能:** 根据实际执行结果更新任务状态，并在每个 Stage 完成后创建一次原子提交。

**实现说明:** 每个 Stage 完成后把对应任务状态更新为 `Finished`，提交信息必须符合仓库 Conventional Commits 规则。未经用户验收，不移动到 `docs/exec-plans/completed/`，不更新归档索引。

**预期验证结果:** active 计划准确反映当前开发进度；提交粒度与 Stage 对齐；工作区不包含无关改动。

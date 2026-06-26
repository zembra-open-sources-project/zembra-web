# r019-live-markdown-editor 开发计划

## 关联文档

- 需求澄清文档：`docs/request-clarify/home-ui/r019-live-markdown-editor.md`
- 设计文档：`docs/design-docs/home-ui/r019-live-markdown-editor.md`

## Stage #1: 契约、依赖和测试夹具预检

### Task #1: 核实 tag 创建改为 note 提交隐式创建

**Status:** Finished

**Files:** Verify `src/api/taxonomy.client.ts`, Verify `src/api/types.ts`, Verify live OpenAPI endpoint

**功能:** 确认当前实现不需要独立 tag 创建接口，tag 创建通过 note create/update 的 `tags` payload 隐式完成。

**实现说明:** 已读取实时 OpenAPI，当前后端没有独立 tag 创建接口。用户已确认改为 note 提交隐式创建，因此不新增 `taxonomyClient.createTag()`，不猜测 `POST /tags`。编辑器创建项只把 `#xxx` 写入 Markdown 字符串，提交时继续由 `parseTagNames(content)` 生成 `tags` payload，后端在 note create/update 中创建或关联 tag。

**预期验证结果:** Stage #1 不再被缺失的独立 tag 创建接口阻塞；后续实现只验证 note create/update payload 中包含新 tag path。

### Task #2: 确认成熟编辑器依赖组合和安装清单

**Status:** Designed

**Files:** Modify `package.json`, Modify `package-lock.json`, Verify `docs/references/dependency-constraints.md`

**功能:** 引入满足 r019 的成熟 Markdown 富文本编辑器依赖，优先使用 Tiptap 方案。

**实现说明:** 依据设计文档优先评估 Tiptap React、Markdown/GFM、Mention/Suggestion、表格、任务列表等官方包。新增依赖前核对 `docs/references/dependency-constraints.md`，确认不引入数据库、ORM、migration、Supabase 查询或重型 UI 套件。安装后检查 `package-lock.json`，避免混入无关依赖。若 Tiptap 当前官方 Markdown 能力无法覆盖纯字符串 round-trip 和换行保真，必须先回到设计取舍，不能改成自研 parser 或缩水实现。

**预期验证结果:** `package.json` 和 lockfile 中只出现 r019 必需的编辑器依赖；依赖选择能覆盖实时 Markdown、GFM、tag suggestion 和 Markdown 字符串输出。

### Task #3: 建立编辑器测试入口和基础 mock

**Status:** Designed

**Files:** Create `src/pages/home/liveMarkdownEditorUtils.test.ts`, Modify `src/pages/home/HomePage.test.tsx`, Verify existing test setup

**功能:** 为后续编辑器、tag suggestion 和换行保真测试准备稳定测试入口。

**实现说明:** 先补纯函数测试骨架，覆盖 tag 候选过滤输入输出。组件测试继续使用 Testing Library 验证用户可观察行为和语义 DOM，不断言编辑器库内部 class、固定尺寸、颜色或 Tailwind 原子类。必要时为编辑器库增加最小测试环境适配，但不得把测试写成库内部实现细节快照。

**预期验证结果:** 新测试文件能运行；后续任务可以逐步补充失败用例再实现。

## Stage #2: 编辑器基础组件和字符串同步

### Task #1: 新增 LiveMarkdownEditor 核心组件

**Status:** Designed

**Files:** Create `src/pages/home/LiveMarkdownEditor.tsx`, Modify `src/pages/home/NoteEditor.tsx`

**功能:** 用成熟编辑器库承载实时 Markdown 编辑体验，并保持 `NoteEditor` 对外 props 语义稳定。

**实现说明:** `LiveMarkdownEditor` 接收 `value: string`、`onChange: (value: string) => void`、`tags` 等必要 props。内部初始化成熟编辑器 document model，加载外部 Markdown 字符串，并在内容变化时通过官方 Markdown serializer 输出纯字符串。`NoteEditor` 保留提交按钮、取消按钮、warning、meta 和 toolbar 容器职责，把原有 `textarea` 替换为 `LiveMarkdownEditor`。避免在 `HomePage` 中持有编辑器 document model。

**预期验证结果:** 创建态和编辑态仍能输入并回写 `draft` / `editDraft` 字符串；提交按钮禁用规则继续基于字符串 `trim()`；没有引入第二份页面级内容状态。

### Task #2: 实现 Markdown 扩展集合

**Status:** Designed

**Files:** Modify `src/pages/home/LiveMarkdownEditor.tsx`, Modify `src/styles/main.css`

**功能:** 覆盖 r019 要求的完整 GFM 编辑态实时渲染。

**实现说明:** 配置标题、段落、强调、删除线、无序列表、有序列表、任务列表、引用、分割线、链接、行内代码、代码块和表格能力。表格在窄宽度下必须使用可控宽度或内部滚动，不能撑破 composer 或 note card。原始 HTML 不得作为可执行 HTML 注入。样式复用现有 CSS token，编辑器内容区需要和 floating / embedded 两种 `NoteEditor` 外壳兼容。

**预期验证结果:** 输入或加载 Markdown 后，编辑器内部显示对应语义结构；表格和代码块不破坏布局；未引入语法高亮库。

### Task #3: 迁移工具栏插入行为

**Status:** Designed

**Files:** Modify `src/pages/home/NoteEditor.tsx`, Modify `src/pages/home/LiveMarkdownEditor.tsx`, Verify `src/pages/home/homeTypes.ts`

**功能:** 让现有 tag、field、bold、list 工具按钮继续作用于新编辑器。

**实现说明:** 不再依赖 `textarea.selectionStart`。通过成熟编辑器 command 或 transaction 在当前 selection 插入对应 Markdown 片段或触发对应 mark/list 行为。按钮可继续使用现有 `ComposerTool` 数据结构；如现有结构无法表达编辑器 command，可在 `NoteEditor` 内部做最小适配，避免为四个按钮新建复杂抽象。

**预期验证结果:** 点击工具按钮能在当前光标位置插入或应用对应内容；创建态和编辑态行为一致。

## Stage #3: Markdown 字符串输出和换行保真

### Task #1: 锁定普通多行文本回归测试

**Status:** Designed

**Files:** Modify `src/pages/home/HomePage.test.tsx`, Modify `src/pages/home/liveMarkdownEditorUtils.test.ts`

**功能:** 先用测试固定“输入框换行不能被压成单行”的 bug。

**实现说明:** 覆盖普通两行文本、空行分段和提交 payload 中的 `content`。测试应断言输出字符串保留内部换行，保存后展示态不把文本合并成一团。不要通过样式 class 判断换行，要通过字符串、段落语义或可观察文本结构验证。

**预期验证结果:** 在未实现换行保真前，测试能暴露文本被合并的问题；实现后测试通过。

### Task #2: 实现 serializer 换行保真规则

**Status:** Designed

**Files:** Modify `src/pages/home/LiveMarkdownEditor.tsx`, Create/Modify `src/pages/home/liveMarkdownEditorUtils.ts`

**功能:** 确保编辑器官方 Markdown 输出保留普通换行、段落、列表、引用和代码块换行语义。

**实现说明:** 优先使用编辑器库官方 serializer 配置、extension 或 node rule 保留换行。禁止在提交前简单替换空格、拼接 `<br>` 字符串、从 DOM `textContent` 抓取文本或手写 Markdown parser 兜底。现有提交路径可以继续 `content.trim()` 去掉首尾空白，但不能删除正文内部换行。

**预期验证结果:** 普通多行、空行分段、列表多项、引用多行和代码块多行输出为可被 Markdown renderer 正确解释的字符串。

### Task #3: 对齐展示态软换行显示

**Status:** Designed

**Files:** Modify `src/pages/home/NoteMarkdownContent.tsx`, Modify `src/styles/main.css`, Modify `src/pages/home/HomePage.test.tsx`

**功能:** 确保保存后的多行 note 在展示态不会挤成一团。

**实现说明:** 如果 `react-markdown` 默认把普通软换行折叠，需要通过成熟 Markdown 插件、renderer 配置或安全样式策略处理普通换行显示，同时不能破坏段落、列表、引用和代码块语义。不得启用原始 HTML 执行。测试应覆盖普通多行文本和 Markdown block 的展示差异。

**预期验证结果:** 保存后的普通多行 note 在 NoteCard 中可见为换行或独立段落；列表、引用和代码块仍保持语义化结构。

## Stage #4: Tag chip、suggestion 和隐式创建

### Task #1: 实现 tag 候选过滤纯函数

**Status:** Designed

**Files:** Create `src/pages/home/liveMarkdownEditorUtils.ts`, Modify `src/pages/home/liveMarkdownEditorUtils.test.ts`

**功能:** 提供 tag suggestion 的稳定过滤规则。

**实现说明:** 输入 `query` 和 `TagDto[]`，返回匹配项和是否显示创建项。单独 `#` 不触发候选；`query.length >= 1` 才匹配。匹配同时覆盖 `tag.path` 和 `tag.name`，大小写不敏感，二级 tag 显示完整 path。无匹配时返回创建项文案所需的 tag 值。

**预期验证结果:** 过滤测试覆盖 path 匹配、name 匹配、无匹配创建项、单独 `#` 不弹出。

### Task #2: 实现编辑器内 tag chip 和 suggestion popup

**Status:** Designed

**Files:** Modify `src/pages/home/LiveMarkdownEditor.tsx`, Modify `src/pages/home/NoteEditor.tsx`, Modify `src/pages/home/HomePage.tsx`, Modify `src/pages/home/NoteCard.tsx`, Modify `src/styles/main.css`

**功能:** 在编辑器内部把 `#path` 渲染为 chip，并在输入 `#query` 时展示候选或创建项。

**实现说明:** 使用成熟库 Mention/Suggestion 或等价官方扩展机制，触发字符为 `#`。选择已有 tag 后替换当前 token 为完整 `#path` chip；选择创建项时插入 `#query` chip，不调用独立 API。serializer 必须把 tag chip 输出为可被 `parseTagNames()` 解析的 `#path`，不能输出隐藏 id、HTML span 或不可解析格式。

**预期验证结果:** 输入 `#h` 出现候选；选择 `books/hands-on-gpt` 后编辑器显示 chip，字符串包含 `#books/hands-on-gpt`；无匹配选择创建项后字符串包含 `#query`，提交 payload 的 `tags` 包含 `query`。

### Task #3: 补齐 tag suggestion i18n

**Status:** Designed

**Files:** Modify `src/i18n/locales/zh-CN/home.ts`, Modify `src/i18n/locales/zh-TW/home.ts`, Modify `src/i18n/locales/en-US/home.ts`, Verify `src/i18n/resources.test.ts`

**功能:** 增加创建项、空状态和保存提示文案。

**实现说明:** 增加 `composer.tagSuggestion.create`、`composer.tagSuggestion.empty` 和必要的保存时创建提示；如实现需要 suggestion list 或 tag chip 的 aria label，同步补齐三语言。用户 note content、tag path、field name 不翻译。

**预期验证结果:** i18n 资源完整性测试通过；UI 中不出现裸英文临时文案。

## Stage #5: 页面集成和回归验证

### Task #1: 集成创建态和编辑态数据流

**Status:** Designed

**Files:** Modify `src/pages/home/HomePage.tsx`, Modify `src/pages/home/NoteCard.tsx`, Modify `src/pages/home/NoteEditor.tsx`

**功能:** 将 tags 和编辑器状态接入创建 composer 与 note card 编辑态。

**实现说明:** `HomePage` 继续持有 `draft` 和 `editDraft` 字符串，不持有编辑器 document model。创建提交和编辑提交继续调用 `parseFieldNames()`、`parseTagNames()`、`parseNoteLinks()`。`NoteCard` 编辑态只通过 props 接收字符串和变更回调，展示态继续使用 `NoteMarkdownContent`，双链 preview 不受影响。

**预期验证结果:** 创建和编辑都能实时编辑 Markdown；提交 payload 的 `content`、`tags`、`field` 和 `links` 与字符串解析结果一致。

### Task #2: 完成组件行为测试

**Status:** Designed

**Files:** Modify `src/pages/home/HomePage.test.tsx`, Modify `src/pages/home/liveMarkdownEditorUtils.test.ts`

**功能:** 覆盖 r019 验收标准的用户可观察行为。

**实现说明:** 测试覆盖列表、任务列表、引用、代码、表格、链接、tag suggestion、隐式创建 tag、换行保真和提交 payload。避免断言编辑器库内部 class 或 DOM 细节；只断言语义结构、可访问文本、请求体和字符串输出。对异步 suggestion 使用 Testing Library 的 async 查询。

**预期验证结果:** 定向 HomePage 和工具函数测试通过，能证明不是局部 tag 或列表的缩水实现。

### Task #3: 运行自动化验证

**Status:** Designed

**Files:** Verify `package.json`, Verify `package-lock.json`, Verify `src/pages/home/HomePage.test.tsx`, Verify `src/features/notes/noteStore.ts`

**功能:** 确认测试、类型检查和生产构建通过。

**实现说明:** 至少运行 `npm run test -- src/pages/home/HomePage.test.tsx src/pages/home/liveMarkdownEditorUtils.test.ts`，再运行 `npm run test` 和 `npm run build`。如新增依赖需要安装，先完成 `npm install` 并提交 lockfile。若测试环境缺少编辑器所需 DOM API，应增加最小 test setup，而不是跳过核心测试。

**预期验证结果:** 定向测试、全量测试和 build 全部通过。

### Task #4: 浏览器手工回归和计划状态回写

**Status:** Designed

**Files:** Modify `docs/exec-plans/active/home-ui/r019-live-markdown-editor.md`, Verify `http://localhost:5173/`

**功能:** 在真实页面确认 r019 编辑器体验，并按执行结果更新计划状态。

**实现说明:** 启动或复用 Vite dev server，检查创建态和编辑态：列表、任务列表、引用、表格、代码、链接、普通多行、空行分段、tag suggestion、隐式创建 tag、提交后展示。每个 Stage 完成后按项目规则进行原子提交。未经用户验收，不移动到 `docs/exec-plans/completed/`，不更新 `docs/PROGRESS.md` 归档项。

**预期验证结果:** 浏览器手工路径可用；计划状态准确；工作区不包含无关改动。

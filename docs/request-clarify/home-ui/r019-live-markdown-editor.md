# r019-live-markdown-editor 需求澄清

日期：2026-06-26

## 需求背景

当前首页创建笔记和编辑笔记共用 `NoteEditor`，底层是原生 `textarea`。这种实现只能显示 Markdown 源码，不能在编辑态实时渲染列表、任务列表、标题、引用、代码、链接、表格等 Markdown 样式，也不能把 `#tag` 在文本内部渲染成 chip。展示态已经通过 `NoteMarkdownContent` 使用 `react-markdown` 和 `remark-gfm` 渲染 GFM，但该能力只发生在保存后的 note card 展示态，不满足输入过程的实时性要求。

本需求要求把笔记输入框升级为成熟现成库驱动的实时 Markdown 富文本编辑器。用户明确要求必须严格搜索互联网并使用已有现成库，禁止自研 Markdown 编辑器、禁止 `textarea + preview`、禁止只实现 tag 或列表的阉割方案。

## 需求目标

首页创建 composer 和 note card 编辑态都需要使用同一套实时 Markdown 编辑器。用户输入 Markdown 时，当前支持的 Markdown 样式必须在编辑器内部实时渲染显示；用户输入 `#tag` 时，tag 必须在文本内部显示为 chip，并在输入至少一个 tag 字符后弹出 tag 候选。底层内容仍是纯 Markdown 字符串，本需求修改的是编辑态渲染流程，不改变 note content 的存储格式。

```text
编辑器内部实时显示

# 今日整理

- [ ] 读完文档
- [x] 写实现计划

关联 [#books/hands-on-gpt] 和 **重点**
                 │
                 └─ 输入 #h 后弹出：
                    #books/hands-on-gpt
                    #health
                    创建 #h
```

## 已确认决策

| 决策项 | 结论 |
| --- | --- |
| 编辑器形态 | 文本内部实时渲染 Markdown 和 tag chip，不做下方预览行。 |
| 底层数据 | 保持纯 Markdown 字符串，编辑器渲染流程负责实时显示。 |
| 换行语义 | 输入框中的换行必须保留为真实换行，不能在编辑器输出或保存后展示中被压成单行。 |
| Markdown 能力 | 当前展示态支持的 GFM 样式都必须进入编辑态实时渲染范围。 |
| 实现方式 | 必须使用成熟现成编辑器库，禁止自研核心 Markdown 编辑器或阉割实现。 |
| tag 选单触发 | 单独输入 `#` 不弹出；输入至少一个 tag 字符后才弹出。 |
| tag 匹配 | 同时匹配完整 path 和当前层级 name。 |
| 无匹配项 | 显示“创建 #xxx”。 |
| 创建 tag | 选择“创建 #xxx”时只将 `#xxx` 写入编辑器内容，真正创建在 note create/update 提交时通过现有 `tags` payload 隐式完成。 |
| 键盘交互 | 用户未要求，不作为本轮需求边界。 |

## 联网调研结论

联网核对官方文档后，当前方向应优先使用成熟 Markdown 富文本编辑器生态，而不是基于 `textarea` 自行拼装。Tiptap 官方文档提供 React 集成、Markdown 输入输出、GFM、表格、任务列表、Mention 和 Suggestion 能力，适合作为设计阶段推荐方案。Lexical 官方文档提供 Markdown package 和编辑器基础设施，但 Markdown round-trip、tag suggestion 与 GFM 扩展需要更多拼装。Milkdown 定位为 Markdown WYSIWYG 编辑器，可作为备选方向。设计阶段推荐优先评估 Tiptap，备选 Milkdown；Lexical 作为可行但集成成本更高的备选。

参考官方文档：`https://tiptap.dev/docs/editor/markdown/getting-started/basic-usage`、`https://tiptap.dev/docs/editor/extensions/nodes/mention`、`https://tiptap.dev/docs/editor/api/utilities/suggestion`、`https://lexical.dev/docs/packages/lexical-markdown`、`https://milkdown.dev/`。

## 仓库现状关联

| 模块 | 当前状态 | 本需求影响 |
| --- | --- | --- |
| `src/pages/home/NoteEditor.tsx` | 原生 `textarea`，通过 toolbar 插入 Markdown 片段 | 需要替换为成熟编辑器库封装的实时 Markdown 编辑器。 |
| `src/pages/home/HomePage.tsx` | 创建态持有 `draft` 字符串，提交时解析 field、tag 和 note link | 继续持有纯字符串，并把现有 tags 传给编辑器用于候选匹配。 |
| `src/pages/home/NoteCard.tsx` | 编辑态复用 `NoteEditor`，展示态使用 `NoteMarkdownContent` | 编辑态同样切换到新编辑器；展示态保留现有 renderer。 |
| `src/pages/home/NoteMarkdownContent.tsx` | 展示态 GFM renderer，保留双链 preview | 可复用展示样式经验，但不能当作编辑器实现。 |
| `src/pages/home/homeUtils.ts` | 提供 `parseTagNames()`、`parseFieldNames()`、`parseNoteLinks()` 等字符串解析 | 保存链路继续复用这些函数，保证输出契约不变。 |
| `src/api/taxonomy.client.ts` | 只支持 `listTags()` 和 `listFields()` | 不需要新增创建 tag client；tag 创建继续由 note create/update 的 `tags` payload 在后端隐式完成。 |
| `docs/references/dependency-constraints.md` | 条件允许 Tiptap 或同类富文本编辑器依赖 | 本需求已经确认富文本需求，允许进入依赖设计。 |

## 范围确认

### In Scope

| 范围 | 说明 |
| --- | --- |
| 创建 composer 实时编辑 | 首页底部创建输入框实时渲染 Markdown 和 tag chip。 |
| note card 编辑态实时编辑 | 原地编辑 note 时使用同一套编辑器能力。 |
| 完整 GFM 编辑态渲染 | 标题、段落、强调、删除线、无序列表、有序列表、任务列表、引用、分割线、链接、行内代码、代码块和表格都需要在编辑态实时显示。 |
| tag chip | `#tag` 和 `#root/child` 在文本内部显示为 chip。 |
| tag suggestion | 输入至少一个 tag 字符后弹出候选，候选同时匹配完整 path 和当前层级 name。 |
| 创建 tag 候选 | 无匹配时显示“创建 #xxx”，选中后把 `#xxx` 写入编辑器内容，提交 note 时由现有 tags payload 隐式创建。 |
| 纯字符串输出 | 编辑器对外输出 Markdown 字符串，保存时继续使用现有解析函数生成 tags、field 和 links。 |
| 换行保真 | 普通换行、空行分段、列表项换行、引用内换行和代码块内换行必须在编辑态、Markdown 字符串输出和保存后展示态之间保持一致。 |
| 成熟库引入 | 选择成熟编辑器库，优先考虑 Tiptap，必要时比较 Milkdown 或 Lexical。 |
| 自动化测试 | 覆盖编辑态 Markdown 语义渲染、字符串输出、tag suggestion、隐式创建 tag 的提交 payload。 |

### Out of Scope

| 范围 | 说明 |
| --- | --- |
| `textarea + preview` | 不满足文本内部实时渲染要求。 |
| 局部 tag overlay | 不满足全部 Markdown 样式实时渲染要求。 |
| 自研 Markdown parser/editor | 用户明确禁止。 |
| tag 管理页 | 本轮只处理编辑器内创建入口。 |
| tag 重命名、移动、删除 | 属于独立 tag 管理能力。 |
| 后端 schema 或数据库改动 | 前端只按实时 OpenAPI 调用既有或新增后端接口。 |
| 原始 HTML 执行 | Markdown 中的 HTML 不作为 HTML 注入或执行。 |
| 代码块语法高亮库 | 除非所选编辑器基础能力自然提供，否则不额外扩展。 |

## 验收标准

| 编号 | 标准 |
| --- | --- |
| A1 | 创建 composer 输入 `- item` 时，编辑器内部显示为列表结构，不只显示源码短横线。 |
| A2 | 编辑 note 时，已有 Markdown 内容进入编辑器后以渲染态显示，保存后 note content 仍是等价 Markdown 字符串。 |
| A3 | `**bold**`、`*italic*`、`~~delete~~`、引用、行内代码、代码块、链接、表格、任务列表和分割线在编辑态实时显示。 |
| A4 | 输入 `#` 不弹出 tag 选单；输入 `#h` 后弹出候选。 |
| A5 | 候选同时匹配完整 path 和当前层级 name，例如 `hands-on-gpt` 可匹配 `books/hands-on-gpt`。 |
| A6 | 无匹配时显示“创建 #xxx”。 |
| A7 | 选择“创建 #xxx”时当前 token 替换为新 tag chip，最终 Markdown 字符串包含 `#xxx`，提交 note 时 payload 的 `tags` 包含 `xxx`。 |
| A8 | 选择已有 tag 时，当前 token 替换为对应完整 path 的 tag chip，最终 Markdown 字符串包含对应 `#path`。 |
| A9 | 创建和编辑提交仍调用现有 note create/update 链路，并通过字符串解析得到 tags、field 和 links。 |
| A10 | 实现不包含自研核心 Markdown 编辑器、手写 Markdown parser 或 `textarea + preview` 降级方案。 |
| A11 | 用户在输入框中输入多行普通文本时，编辑态能看到真实换行，保存后的 `note.content` 保留换行，展示态不把所有文本挤成一团。 |
| A12 | 用户输入空行分段、列表内多项、引用多行或代码块多行时，编辑器 Markdown 输出保留对应换行语义。 |

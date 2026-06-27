# r019-toolbar-live-preview-supplement 开发计划

## 关联文档

- 需求澄清文档：`docs/request-clarify/home-ui/r019-live-markdown-editor.md`
- 设计文档：`docs/design-docs/home-ui/r019-live-markdown-editor.md`

## Stage #1: 补齐工具栏按钮回归测试

### Task #1: 固定按钮实时预览缺陷

**Status:** Finished

**Files:** Modify `src/pages/home/HomePage.test.tsx`

**功能:** 增加用户可观察行为测试，覆盖加粗、列表、标签和 Field 按钮在创建 composer 中的实时编辑效果与 Markdown 字符串同步。

**验证:** 已使用 bundled Node 运行 `/Users/yat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/vitest/vitest.mjs run src/pages/home/HomePage.test.tsx`。新增测试失败在列表按钮断言，编辑器内没有 `li`，确认当前实现仍是普通文本插入。系统 `npm run test` 当前被 Homebrew Node 缺失 `libllhttp.9.3.dylib` 阻塞，因此本轮验证使用 bundled Node 直接执行 Vitest。

## Stage #2: 最小实现按钮 command 分派

### Task #1: 将工具栏纯文本插入改为 command/transaction

**Status:** Finished

**Files:** Modify `src/pages/home/LiveMarkdownEditor.tsx`, Modify `src/pages/home/NoteEditor.tsx`, Modify `src/pages/home/homeTypes.ts`

**功能:** 在不新增复杂抽象的前提下，使用现有 `ComposerTool.id` 分派按钮行为。`bold` 使用 Tiptap mark command，`list` 使用 Tiptap list command，`tag` 和 `field` 保持文本插入并同步 Markdown。

**验证:** 已使用 bundled Node 运行 `/Users/yat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/vitest/vitest.mjs run src/pages/home/HomePage.test.tsx`，首页 24 个测试全部通过。

## Stage #3: 全量验证和提交

### Task #1: 运行项目级验证

**Status:** Finished

**Files:** Verify `src/pages/home/LiveMarkdownEditor.tsx`, Verify `src/pages/home/NoteEditor.tsx`, Verify `src/pages/home/HomePage.test.tsx`, Verify docs changes

**功能:** 确认补充实现没有破坏 r019 既有编辑器能力、首页测试和生产构建。

**验证:** 系统 `npm run test` / `npm run build` 当前被 Homebrew Node 缺失 `libllhttp.9.3.dylib` 阻塞。本轮使用 bundled Node 执行等价入口并通过：`./node_modules/vitest/vitest.mjs run src/pages/home/liveMarkdownEditorUtils.test.ts src/pages/home/HomePage.test.tsx` 通过 30 个测试，`./node_modules/vitest/vitest.mjs run` 通过 111 个测试，`./node_modules/typescript/bin/tsc -b` 通过，`./node_modules/vite/bin/vite.js build` 通过。

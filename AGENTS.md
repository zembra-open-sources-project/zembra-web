# AGENTS

## Codex 持续开发工作流

### 开发流程约

本项目的所有需求开发，除非用户在 Prompt 中指定特殊流程，否则严格遵守如下步骤完成：

1. 需求澄清：接到用户需求后，首先进行需求澄清，确认功能范围。需求澄清过程以用户多轮交互的方式完成，澄清结束后，按模块写入 docs/request-clarify/ 下对应目录，写入方式为新建文件。
2. 基于需求澄清结果，完成方案设计，必要时和用户交互完成方案决策，按模块新建文件写入 docs/design-docs/ 下对应目录，该文件中需要记录需求澄清文档位置。写入后提醒用户审阅。设计文档中禁止堆砌代码，涉及接口设计、字段设计等内容时，以表格形式清晰说明即可，必要时可使用函数签名，但不要在文档中列举代码实现。
3. 根据技术设计结果，制定执行计划，按模块新建文件写入到 docs/exec-plans/active/ 下对应目录，提醒用户审核修改。开发计划必须记录需求澄清文档和设计文档的路径，开发计划中根据需求的工作量，划分为不同 Stage，并在 Stage 根据必要性划分为不同的 Task。
4. 根据执行计划进行开发，并更新执行计划中的任务状态，完成每个 Stage 后，如果修改了任何代码，必须进行一次 git 提交。
5. 用户验证后，将开发计划移动到 docs/exec-plans/completed/，并更新`docs/PROGRESS.md`文件。在未经用户允许，禁止擅自归档
6. 所有项目文档默认使用 markdown 格式撰写，语言为简体中文；关键术语、函数接口、代码标识符和第三方工具名可保留英文。除非用户明确指定其他语言，新增或更新 docs/、AGENTS.md、ARCHITECTURE.md 等文档时必须使用简体中文。

### 初始化规则
- 初始化命令只创建缺失目录和文件。
- 已存在目录和文件必须 SKIP，禁止覆盖、删除、重命名或改写已有内容。
- 初始化输出只报告新建和跳过的目录/文件，不输出项目业务内容。
- 初始化只建立持续开发工作流骨架，不执行具体需求开发。

### 文档系统说明
- AGENTS.md 记录全局工作流、文档阅读顺序、产物落点、禁止事项和关键入口。
- ARCHITECTURE.md 描述系统全局结构、模块边界、依赖方向和不变量。
- docs/request-clarify/ 存放需求澄清结果，可按模块建立子目录。
- docs/design-docs/ 存放设计决策、设计理念和子系统方案，可按模块建立子目录。
- docs/product-specs/ 存放功能规格、用户流程、验收标准。
- docs/exec-plans/active/ 存放进行中的执行计划，可按模块建立子目录。
- docs/exec-plans/completed/ 存放已完成且已通过用户验收的执行计划，可按模块建立子目录。
- docs/exec-plans/tech-debt-tracker.md 记录项目的技术债。
- docs/references/ 存放外部依赖、协议、框架和工具参考资料摘要。
- docs/generated/ 存放自动生成文档；默认只读，不手工维护。
- `docs/PROGRESS.md` 项目进度追踪文件，包含两个章节。`项目流程记录` 章节记录项目计划与阶段推进状态，针对每个需求，记录需求编号、git HEAD id（保留前八位），然后使用连续的、不超过200字的简体中文描述本次开发实现的计划以及实现情况，每个需求只允许记录一个条目，如果存在该条目，则在已有内容基础上追加。
- docs/DESIGN.md 记录项目的设计规则，包括 UI 设计、功能设计规范。
- docs/FRONTEND.md 记录项目的前端设计架构。
- docs/PRODUCT_SENSE.md 记录产品判断和体验原则。
- docs/QUALITY_SCORE.md 记录质量评估标准。
- docs/RELIABILITY.md 记录项目可靠性设计。
- docs/SECURITY.md 记录项目安全规范。

### 共享数据库契约
- 本项目群的数据表契约来自 `vendor/zembra-schema` submodule，远程仓库为 `https://github.com/gawainx/zembra-schema.git`。
- 当前固定版本为 `v0.1.0`，submodule commit 为 `a557f37c2827eb5cd8cd2ca4dd639a082764a763`。
- 数据表说明、SQLite DDL、JSON Schema 和 migration 以 `vendor/zembra-schema` 为准，本仓库禁止复制维护数据表设计正文。
- 前端代码只能通过 API Client 或 Repository 层消费业务数据，禁止让 UI 组件直接依赖 SQLite 表结构或未来 Supabase 的具体查询实现。
- 涉及 schema 升级时，必须先确认兼容性；如果存在破坏性变化，需要同步更新前端数据访问逻辑和迁移策略说明。

### 依赖约束
- 新增前端依赖前必须先核对 `docs/references/dependency-constraints.md`。
- 前端仓库默认禁止引入 SQLite driver、ORM、数据库 migration 运行时依赖，除非用户明确批准并同步更新约束文档。
- Supabase SDK 只能在认证、实时订阅或明确直连场景中局部使用，禁止 UI 组件直接依赖 Supabase 查询实现。
- 涉及数据库、schema、同步或持久化的新依赖，必须先记录到需求澄清文档，再进入设计或实现。

### 日志规范
- 涉及前后端边界、外部服务调用、启动门禁、配置读取写入和错误兜底时，必须合理补充关键日志。
- 日志至少覆盖开始、成功、失败和关键上下文，避免吞掉异常；前端使用 `console.info`、`console.warn` 或 `console.error`。
- 日志禁止记录密钥、token、密码、service role key 等敏感信息。

### API 契约规范
- 前端请求路径、健康检查路径、默认后端地址和示例 URL 必须来自实时 OpenAPI、后端文档或已存在代码契约，禁止凭经验捏造路径。
- 后端 URL 配置只表示服务根地址，不得在前端默认追加未确认的路径前缀。
- 当后端契约不清楚时，必须先查证 OpenAPI 或后端文档；无法查证时停止并说明缺失信息。

### 测试规范
- 严格禁止编写绑定静态视觉实现细节的测试用例，包括但不限于颜色、字体大小、固定宽度、固定高度、padding、margin、gap、圆角、阴影、具体 CSS class 名称或 Tailwind 原子类。
- 前端测试必须优先验证用户可观察行为、语义结构、可访问性名称、数据渲染、状态变化和 API 交互结果。
- 若确需覆盖布局规则，只允许验证稳定的产品语义或交互约束，例如“每列 5 天”这类明确需求；禁止通过断言 `h-[35px]`、`text-sm`、`bg-*` 等静态样式类实现。

### 前端组件模块化纪律
- 页面文件只负责路由级编排、数据装配、状态协调和少量页面专属事件处理，禁止把复杂业务控件、可复用 UI 控件和纯工具函数长期堆在同一个页面文件中。
- 当单个页面文件同时包含页面主体、多个内部组件、解析/格式化/统计函数或超过约 300 行时，必须优先拆分为同目录独立组件文件、`*Utils.ts` 工具文件和必要的共享类型文件。
- 像 note card、editor、sidebar section、heatmap、导航行这类有明确职责和独立状态/交互的 UI 单元，必须以独立组件维护；页面只能通过 props 组合它们。
- 拆分组件时默认保持行为和视觉不变，先做结构边界治理，再单独处理功能或样式需求，避免把重构和产品变更混在同一次改动里。
- 新增工具函数必须按职责命名并放到模块化文件中，禁止在页面文件底部持续追加解析、计数、格式化等无 UI 状态的函数。

### 前端响应式布局纪律
- 多个文本按钮、表单动作、工具栏动作并排展示时，必须先设计响应式布局策略，再写按钮样式。按钮组应由父容器负责可用宽度、间距和溢出处理；按钮自身只负责视觉样式和内容排版。
- 同一动作组内按钮默认不等宽，按内容自适应。短动作使用短文案，关键动作允许自然更宽；禁止为了省事把所有按钮强制等宽后挤压长文案。
- 文本按钮默认不换行，必须使用 `whitespace-nowrap` 或等效约束保持单行动作标签。禁止用固定高度承载会换行的按钮文案，也禁止靠强制换行解决横向空间不足。
- 新增或修改动作按钮时，需要同时检查英文、简体中文、繁体中文文案长度；长文案必须在当前卡片宽度和移动宽度下保持可读，必要时优先缩短非关键动作文案。

阅读规则
- 开始任何任务时先读 AGENTS.md。
- 涉及结构、分层、依赖、模块边界时读 ARCHITECTURE.md 和相关 design docs。
- 涉及需求范围和澄清结论时读 docs/request-clarify/。
- 涉及功能目标、用户流程、验收条件时读 docs/product-specs/。
- 涉及中大改动时先在 docs/exec-plans/active/ 创建或更新执行计划，再开始实施。
- 涉及外部依赖、框架、协议时先读 docs/references/。
- 涉及新增、升级或移除依赖时先读 `docs/references/dependency-constraints.md`。
- 涉及数据表、SQLite、JSON Schema、migration 或 Supabase 迁移时先读 `docs/references/shared-schema.md` 和 `vendor/zembra-schema`。
- 涉及生成物时只读 docs/generated/，不手工修改 generated 下的内容。

写回规则：
- 需求澄清结果写入 docs/request-clarify/。
- 技术设计和方案决策写入 docs/design-docs/。
- 执行计划、阶段进度、决策日志写入 docs/exec-plans/active/。
- 当前专注任务、流程记录、验证记录和归档索引写入 docs/PROGRESS.md。
- 遗留问题和明确未解决事项写入 docs/exec-plans/tech-debt-tracker.md。
- 工具或脚本生成的摘要写入 docs/generated/。

模块化文档落点：
- docs/request-clarify/、docs/design-docs/、docs/exec-plans/active/ 和 docs/exec-plans/completed/ 支持按模块建立子目录。
- 模块子目录命名应与代码模块、业务域或长期维护边界一致。
- 同一需求的澄清、设计、计划文档应使用同名文件，分别落入对应文档层。

文档命名规则：
- 默认命名格式为 rNNN-request-desc.md。
- 启用模块编号时，可使用 rwNNN-request-desc.md、rbNNN-request-desc.md、rpNNN-request-desc.md 等格式。
- w、b、p 是示例子模块前缀，必须根据项目模块变化调整。
- 同一需求在 request-clarify、design-docs、exec-plans 中使用同名文件。
- 日期只允许写在文档头部，不放入文件名。

执行计划状态规则：
- docs/exec-plans/active/ 只放当前进行中或等待验收的执行计划。
- 未经用户验收的执行计划不得自动移动到 docs/exec-plans/completed/。
- 用户验收通过后，才能把对应执行计划归档到 docs/exec-plans/completed/，并更新 docs/PROGRESS.md。

### 子目录 AGENTS.md 渐进披露
- 子目录 AGENTS.md 只能补充或收紧当前目录及其子树的局部规则。
- 子目录 AGENTS.md 不能覆盖、放宽或删除根 AGENTS.md 中的全局安全规则。
- 规则冲突时，以更严格的安全规则为准。

## Git 安全规则

- commit message 必须遵守 Conventional Commits：feat、fix、docs、style、refactor、perf、test、build、ci、chore、revert。
- 除非用户提示，否则禁止使用 git commit --amend。
- git 操作必须串行执行，避免并发 git add、commit、merge、rebase、checkout、switch。
- 执行 git checkout、git switch 或任何会改变当前分支的操作前，必须先运行 git worktree list，并确认当前 worktree 归属和目标分支占用情况。

## 相关资源

- Backend URL 默认为 `https://localhost:3000`

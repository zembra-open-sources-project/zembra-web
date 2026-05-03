import {
  AtSign,
  Bold,
  CircleHelp,
  Hash,
  List,
  Minus,
  MoreHorizontal,
  Pilcrow,
  Quote,
  Search,
  SendHorizontal,
} from "lucide-react";
import {
  FormEvent,
  MouseEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNotesStore } from "../../features/notes/noteStore";

interface PlaceholderNote {
  /** Stable placeholder note identifier. */
  id: string;
  /** Visual metadata shown above the note body. */
  meta: string;
  /** Main note body used while the recent notes API is pending. */
  content: string;
  /** Tag names rendered as preview pills. */
  tags: string[];
  /** Optional field label rendered in note text. */
  field?: string;
  /** Whether the note shows the expand affordance. */
  hasExpand?: boolean;
  /** Optional reference count text rendered as visual placeholder. */
  reference?: string;
}

interface ComposerTool {
  /** Stable tool identifier. */
  id: string;
  /** Accessible label for the tool button. */
  label: string;
  /** Icon or text rendered inside the tool button. */
  icon: ReactNode;
  /** Text inserted before the current selection. */
  before: string;
  /** Text inserted after the current selection. */
  after?: string;
  /** Cursor offset from insertion start when no text is selected. */
  cursorOffset?: number;
}

const placeholderNotes: PlaceholderNote[] = [
  {
    id: "placeholder-1",
    meta: "置顶 · 2026-04-26 08:40",
    content:
      "一个成熟的笔记首页不应该急着展示复杂能力，而应该先保证三个动作最顺手：快速记录、快速筛选、快速回看。",
    tags: [],
    hasExpand: true,
    reference: "被 3 条笔记引用",
  },
  {
    id: "placeholder-2",
    meta: "2026-04-25 21:15",
    content:
      "左侧的 Fields 和 Tags 使用同一套列表组件，只通过 @ 与 # 区分语义，这样界面会更统一，也更利于后续扩展搜索和快捷输入。",
    tags: ["界面设计", "任务拆解"],
  },
  {
    id: "placeholder-3",
    meta: "2026-04-24 10:08",
    content:
      "在本地优先的笔记应用里，输入区应该固定在用户视线最后停留的位置，因此底部悬浮输入比顶部大输入框更适合高频记录场景。",
    tags: [],
  },
  {
    id: "placeholder-4",
    meta: "2026-04-22 18:32",
    content:
      "当一个页面同时承担输入与阅读两种任务时，强调色应该只服务于少数关键状态：当前筛选、输入聚焦、可点击反馈、主要发送动作。",
    tags: ["AI"],
    field: "研究摘录",
  },
];

const placeholderTags = [
  { name: "AI", count: 134 },
  { name: "界面设计", count: 57 },
  { name: "阅读清单", count: 49 },
  { name: "任务拆解", count: 76 },
  { name: "工具体验", count: 33 },
  { name: "长期想法", count: 61 },
];

const heatmapLevels = [
  0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 4, 0,
  1, 0, 0, 3, 0, 0, 2, 0, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 3, 0, 2, 0, 0,
  0, 0, 1, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 3, 0,
];

/** Renders the redesigned Zembra note workspace shell. */
export function HomePage() {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    fields,
    keyword,
    selectedTag,
    selectedField,
    setKeyword,
    setSelectedTag,
    setSelectedField,
    loadFields,
  } = useNotesStore();

  const composerTools = useMemo(
    () => createComposerTools(),
    [],
  );

  useEffect(() => {
    void loadFields();
  }, [loadFields]);

  /** Handles the visual-only composer submission for the current placeholder phase. */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraft("");
  }

  /** Inserts a composer tool snippet at the current textarea selection. */
  function handleToolClick(
    event: MouseEvent<HTMLButtonElement>,
    tool: ComposerTool,
  ) {
    event.preventDefault();
    insertTextAtSelection(tool);
  }

  /** Inserts text into the composer while preserving a useful cursor position. */
  function insertTextAtSelection(tool: ComposerTool) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? draft.length;
    const end = textarea?.selectionEnd ?? draft.length;
    const selection = draft.slice(start, end);
    const nextDraft = `${draft.slice(0, start)}${tool.before}${selection}${
      tool.after ?? ""
    }${draft.slice(end)}`;
    const cursorPosition =
      start +
      (selection
        ? tool.before.length + selection.length + (tool.after?.length ?? 0)
        : tool.cursorOffset ?? tool.before.length);

    setDraft(nextDraft);
    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  return (
    <main className="min-h-screen bg-[#0f1115] text-[#e8edf3]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1156px] grid-cols-1 gap-8 px-5 pb-44 pt-8 lg:grid-cols-[300px_760px] lg:gap-16 lg:px-0">
        <aside className="min-w-0">
          <div className="mb-7 flex items-center gap-2 text-lg font-bold">
            <span>Zembra</span>
            <span className="rounded-[5px] border border-[#e8edf3]/70 px-1.5 py-0.5 text-[10px] leading-tight">
              LOCAL
            </span>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-4">
            <StatBlock label="笔记" value="--" />
            <StatBlock label="标签" value="--" />
            <StatBlock label="天" value="942" />
          </div>

          <div className="mb-3 grid w-fit grid-cols-12 gap-[9px]" aria-label="活跃热力图占位">
            {heatmapLevels.map((level, index) => (
              <span
                className="size-[18px] rounded bg-[#343941] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] data-[level='1']:bg-[#3f4852] data-[level='2']:bg-[#4a6172] data-[level='3']:bg-[#5f90ac] data-[level='4']:bg-[#8fd3ff]"
                data-level={level}
                key={`${level}-${index}`}
              />
            ))}
          </div>
          <div className="mb-7 flex w-[244px] justify-between text-[13px] text-[#94a0ae]">
            <span>一月</span>
            <span>二月</span>
            <span>三月</span>
          </div>

          <SidebarSection title="Fields">
            <NavItem
              active={selectedField === undefined}
              count={fields.length}
              label="全部"
              prefix="@"
              onClick={() => setSelectedField(undefined)}
            />
            {fields.map((field) => (
              <NavItem
                active={selectedField === field.id}
                count={0}
                key={field.id}
                label={field.name}
                prefix="@"
                onClick={() => setSelectedField(field.id)}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="Tags">
            {placeholderTags.map((tag) => (
              <NavItem
                active={selectedTag === tag.name}
                count={tag.count}
                key={tag.name}
                label={tag.name}
                prefix="#"
                onClick={() =>
                  setSelectedTag(selectedTag === tag.name ? undefined : tag.name)
                }
              />
            ))}
          </SidebarSection>
        </aside>

        <section className="min-w-0">
          <header className="mb-5 flex min-h-11 items-center justify-end">
            <label className="flex h-[42px] w-full max-w-80 items-center gap-2.5 rounded-full bg-[#1c2027] px-4 text-sm text-[#94a0ae]">
              <Search className="size-4" aria-hidden="true" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#94a0ae]"
                placeholder="搜索笔记、Field、Tag"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <span className="text-[#9ea8b4]">⌘+K</span>
            </label>
          </header>

          <div className="flex flex-col gap-3.5">
            {placeholderNotes.map((note) => (
              <article
                className="relative rounded-[18px] border border-white/[0.025] bg-[#1c2027] px-5 py-[18px] shadow-[0_10px_24px_rgba(0,0,0,0.36)]"
                key={note.id}
              >
                <MoreHorizontal
                  className="absolute right-[18px] top-[17px] size-5 text-[#94a0ae]"
                  aria-hidden="true"
                />
                <div className="mb-3.5 text-[13px] text-[#94a0ae]">
                  {note.meta}
                </div>
                <p className="whitespace-pre-wrap pr-7 text-base font-medium leading-7 text-[#e3e8ee]">
                  {note.field ? (
                    <span className="mr-2 font-semibold text-[#8fd3ff]">
                      @{note.field}
                    </span>
                  ) : null}
                  {note.tags.map((tag) => (
                    <span
                      className="mr-1.5 inline-flex h-[25px] items-center rounded-[7px] bg-[#8fd3ff]/20 px-2 text-[13px] font-semibold text-[#8fd3ff]"
                      key={tag}
                    >
                      #{tag}
                    </span>
                  ))}
                  {note.content}
                </p>
                {note.hasExpand ? (
                  <div className="mt-3 text-sm font-semibold text-[#8fd3ff]">
                    展开
                  </div>
                ) : null}
                {note.reference ? (
                  <div className="mt-3 text-[13px] text-[#94a0ae]">
                    {note.reference}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-[154px] bg-gradient-to-t from-[#0f1115] from-[24%] via-[#0f1115]/80 via-[62%] to-transparent" />

      <form
        className="fixed bottom-6 left-5 right-5 z-20 lg:left-1/2 lg:right-auto lg:w-[760px] lg:translate-x-[-198px]"
        onSubmit={handleSubmit}
      >
        <div className="overflow-hidden rounded-[18px] border border-[#8fd3ff]/45 bg-[#1c2027]/95 shadow-[0_18px_46px_rgba(0,0,0,0.44),0_0_0_1px_rgba(143,211,255,0.04)] backdrop-blur">
          <textarea
            className="min-h-[54px] w-full resize-none bg-transparent px-[18px] pb-1.5 pt-4 text-base font-medium leading-6 text-[#e8edf3] outline-none placeholder:text-[#94a0ae]"
            placeholder="现在的想法是..."
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex items-end justify-between px-4 pb-3">
            <div>
              <div className="flex items-center gap-4 text-[#a6afba]">
                {composerTools.map((tool) => (
                  <button
                    className="flex size-7 items-center justify-center rounded-md hover:bg-[#242a33] hover:text-[#e8edf3]"
                    key={tool.id}
                    type="button"
                    aria-label={tool.label}
                    title={tool.label}
                    onClick={(event) => handleToolClick(event, tool)}
                  >
                    {tool.icon}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 text-xs text-[#667180]">
                将保存到 @
                {fields.find((field) => field.id === selectedField)?.name ??
                  "inbox"}
              </div>
            </div>
            <button
              className="flex h-[34px] w-12 items-center justify-center rounded-[10px] bg-[#8fd3ff] text-[#11212d] shadow-[0_8px_18px_rgba(143,211,255,0.16)] hover:bg-[#b8e4ff]"
              type="submit"
              aria-label="发送"
            >
              <SendHorizontal className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>

      <button
        className="fixed bottom-8 right-7 z-20 flex size-[46px] items-center justify-center rounded-full border border-white/[0.04] bg-[#1c2027] text-[#94a0ae] shadow-[0_14px_34px_rgba(0,0,0,0.36)]"
        type="button"
        aria-label="帮助"
      >
        <CircleHelp className="size-5" aria-hidden="true" />
      </button>
    </main>
  );
}

/** Renders a single statistic block in the sidebar. */
function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[30px] font-bold leading-none text-[#cdd4dc]">
        {value}
      </div>
      <div className="mt-2 text-[13px] text-[#94a0ae]">{label}</div>
    </div>
  );
}

/** Renders a titled sidebar navigation section. */
function SidebarSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-xs font-normal tracking-[0.02em] text-[#b89666]">
        {title}
      </h2>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

/** Renders a sidebar navigation row for fields or tags. */
function NavItem({
  active,
  count,
  label,
  onClick,
  prefix,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
  prefix: string;
}) {
  return (
    <button
      className="grid min-h-9 grid-cols-[24px_1fr_auto] items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[15px] text-[#c9d0d8] hover:bg-[#242a33] data-[active=true]:bg-[#8fd3ff]/15 data-[active=true]:text-[#def4ff] data-[active=true]:shadow-[inset_0_0_0_1px_rgba(143,211,255,0.12)]"
      data-active={active}
      type="button"
      onClick={onClick}
    >
      <span className="text-center text-lg font-bold leading-none text-[#8fd3ff]">
        {prefix}
      </span>
      <span className="min-w-0 truncate">{label}</span>
      <span className="text-xs text-[#667180]">{count}</span>
    </button>
  );
}

/** Creates toolbar definitions for the composer insertion buttons. */
function createComposerTools(): ComposerTool[] {
  return [
    {
      id: "tag",
      label: "插入标签",
      icon: <Hash className="size-5" aria-hidden="true" />,
      before: "#",
    },
    {
      id: "field",
      label: "插入 Field",
      icon: <AtSign className="size-5" aria-hidden="true" />,
      before: "@",
    },
    {
      id: "bold",
      label: "加粗",
      icon: <Bold className="size-4" aria-hidden="true" />,
      before: "**",
      after: "**",
      cursorOffset: 2,
    },
    {
      id: "list",
      label: "插入列表",
      icon: <List className="size-5" aria-hidden="true" />,
      before: "\n- ",
    },
    {
      id: "quote",
      label: "插入引用",
      icon: <Quote className="size-5" aria-hidden="true" />,
      before: "\n> ",
    },
    {
      id: "divider",
      label: "插入分隔线",
      icon: <Minus className="size-5" aria-hidden="true" />,
      before: "\n---\n",
    },
    {
      id: "paragraph",
      label: "插入段落标记",
      icon: <Pilcrow className="size-5" aria-hidden="true" />,
      before: "\n\n",
    },
  ];
}

import {
  AtSign,
  Bold,
  CircleHelp,
  Hash,
  List,
  MoreHorizontal,
  Search,
  SendHorizontal,
  Settings,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "../../app/ThemeToggle";
import {
  FormEvent,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNotesStore } from "../../features/notes/noteStore";
import type { NoteDto } from "../../api/types";

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

const heatmapLevels = [
  0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 4, 0,
  1, 0, 0, 3, 0, 0, 2, 0, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 3, 0, 2, 0, 0,
  0, 0, 1, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 3, 0,
];

/** Renders the redesigned Zembra note workspace shell. */
export function HomePage() {
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    notes,
    fields,
    tags,
    keyword,
    selectedTag,
    selectedField,
    setKeyword,
    setSelectedTag,
    setSelectedField,
    createNote,
    loadFields,
    loadRecentNotes,
    loadTags,
  } = useNotesStore();

  const composerTools = useMemo(
    () => createComposerTools(),
    [],
  );
  const fieldNameById = useMemo(
    () => new Map(fields.map((field) => [field.id, field.name])),
    [fields],
  );
  const visibleNotes = useMemo(
    () => filterVisibleNotes(notes, {
      fieldId: selectedField,
      keyword,
      tag: selectedTag,
    }),
    [keyword, notes, selectedField, selectedTag],
  );
  const tagUsage = useMemo(() => countTags(notes), [notes]);

  useEffect(() => {
    void loadFields();
    void loadTags();
    void loadRecentNotes();
  }, [loadFields, loadRecentNotes, loadTags]);

  /** Persists the current composer draft as a new note. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();

    if (!content) {
      return;
    }

    const field =
      fields.find((item) => item.id === selectedField)?.name ?? "inbox";
    const tags = parseTagNames(content);

    setIsSubmitting(true);
    try {
      await createNote({
        content,
        field,
        role: "Human",
        tags,
      });
      setDraft("");
    } finally {
      setIsSubmitting(false);
    }
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
    <main className="h-screen overflow-hidden bg-[var(--color-app-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto grid h-full w-full max-w-[1156px] grid-cols-1 gap-4 px-5 pt-6 lg:grid-cols-[300px_760px] lg:gap-16 lg:px-0 lg:pt-8">
        <aside className="flex min-h-0 min-w-0 flex-col lg:min-h-0">
          <div className="shrink-0">
            <div className="mb-7 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-lg font-bold">
                <span>Zembra</span>
                <span className="rounded-[5px] border border-[var(--color-text-primary)]/70 px-1.5 py-0.5 text-[10px] leading-tight">
                  LOCAL
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ThemeToggle />
                <Link
                  className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
                  title="Settings"
                  to="/settings/sync"
                  aria-label="Settings"
                >
                  <Settings
                    className="size-4 text-[var(--color-accent)]"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>

            <div className="mb-5 hidden grid-cols-3 gap-4 lg:grid">
              <StatBlock label="笔记" value={String(notes.length)} />
              <StatBlock label="标签" value={String(tags.length)} />
              <StatBlock label="Fields" value={String(fields.length)} />
            </div>

            <div className="mb-3 hidden w-fit grid-cols-12 gap-[9px] lg:grid" aria-label="活跃热力图占位">
              {heatmapLevels.map((level, index) => (
                <span
                  className="size-[18px] rounded bg-[var(--color-surface-muted)] shadow-[inset_0_0_0_1px_var(--color-border-subtle)] data-[level='1']:bg-[color-mix(in_srgb,var(--color-accent)_18%,var(--color-surface-muted))] data-[level='2']:bg-[color-mix(in_srgb,var(--color-accent)_34%,var(--color-surface-muted))] data-[level='3']:bg-[color-mix(in_srgb,var(--color-accent)_58%,var(--color-surface-muted))] data-[level='4']:bg-[var(--color-accent)]"
                  data-level={level}
                  key={`${level}-${index}`}
                />
              ))}
            </div>
            <div className="mb-7 hidden w-[244px] justify-between text-[13px] text-[var(--color-text-muted)] lg:flex">
              <span>一月</span>
              <span>二月</span>
              <span>三月</span>
            </div>
          </div>

          <div className="hidden min-h-0 flex-1 overflow-y-auto pb-44 pr-1 lg:block">
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
              {tags.length === 0 ? (
                <NavItem
                  active={false}
                  count={0}
                  disabled
                  label="暂无标签"
                  prefix="#"
                  onClick={() => undefined}
                />
              ) : null}
              {tags.map((tag) => (
                <NavItem
                  active={selectedTag === tag.name}
                  count={tagUsage.get(tag.name) ?? 0}
                  key={tag.name}
                  label={tag.name}
                  prefix="#"
                  onClick={() =>
                    setSelectedTag(selectedTag === tag.name ? undefined : tag.name)
                  }
                />
              ))}
            </SidebarSection>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <header className="mb-4 flex min-h-11 shrink-0 items-center justify-end lg:mb-5">
            <label className="flex h-[42px] w-full items-center gap-2.5 rounded-full bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text-muted)] shadow-[inset_0_0_0_1px_var(--color-border)] lg:max-w-80">
              <Search className="size-4" aria-hidden="true" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--color-text-muted)]"
                placeholder="搜索笔记、Field、Tag"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <span className="text-[var(--color-text-muted)]">⌘+K</span>
            </label>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto pb-44">
            <div className="flex flex-col gap-3.5">
            {visibleNotes.length === 0 ? (
              <article className="rounded-[18px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-8 text-[var(--color-text-muted)]">
                暂无最近笔记
              </article>
            ) : null}
            {visibleNotes.map((note) => (
              <NoteCard
                fieldName={note.fieldId ? fieldNameById.get(note.fieldId) : undefined}
                key={note.id}
                note={note}
              />
            ))}
            </div>
          </div>
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-[154px] bg-[image:var(--color-composer-gradient)]" />

      <div className="fixed inset-x-0 bottom-6 z-20 px-5 lg:px-0">
        <form
          className="mx-auto grid w-full max-w-[1156px] grid-cols-1 lg:grid-cols-[300px_760px] lg:gap-16"
          onSubmit={handleSubmit}
        >
          <div className="min-w-0 lg:col-start-2">
            <div className="overflow-hidden rounded-[18px] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] shadow-[var(--color-shadow-float)] backdrop-blur">
              <textarea
                className="min-h-[54px] w-full resize-none bg-transparent px-[18px] pb-1.5 pt-4 text-base font-medium leading-6 text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                placeholder="现在的想法是..."
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <div className="flex items-end justify-between px-4 pb-3">
                <div>
                  <div className="flex items-center gap-4 text-[var(--color-text-secondary)]">
                    {composerTools.map((tool) => (
                      <button
                        className="flex size-7 items-center justify-center rounded-md hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
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
                  <div className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                    将保存到 @
                    {fields.find((field) => field.id === selectedField)?.name ??
                      "inbox"}
                  </div>
                </div>
                <button
                  className="flex h-[34px] w-12 items-center justify-center rounded-[10px] bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-[0_8px_18px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  type="submit"
                  aria-label="发送"
                  disabled={isSubmitting || draft.trim().length === 0}
                >
                  <SendHorizontal className="size-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <button
        className="fixed bottom-8 right-7 z-20 flex size-[46px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] shadow-[var(--color-help-shadow)]"
        type="button"
        aria-label="帮助"
      >
        <CircleHelp className="size-5" aria-hidden="true" />
      </button>
    </main>
  );
}

/** Renders one recent note in the home feed. */
function NoteCard({
  fieldName,
  note,
}: {
  fieldName?: string;
  note: NoteDto;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const measureOverflow = useCallback(() => {
    const element = contentRef.current;

    if (!element) {
      return;
    }

    setHasOverflow(element.scrollHeight > element.clientHeight + 1);
  }, []);

  useLayoutEffect(() => {
    measureOverflow();
  }, [measureOverflow, note.content, note.tags, fieldName]);

  useEffect(() => {
    window.addEventListener("resize", measureOverflow);

    return () => window.removeEventListener("resize", measureOverflow);
  }, [measureOverflow]);

  return (
    <article className="relative rounded-[18px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-5 py-[18px] shadow-[var(--color-shadow-card)]">
      <MoreHorizontal
        className="absolute right-[18px] top-[17px] size-5 text-[var(--color-text-muted)]"
        aria-hidden="true"
      />
      <div className="mb-3.5 text-[13px] text-[var(--color-text-muted)]">
        {formatNoteTimestamp(note.updatedAt)}
        {fieldName ? (
          <span className="ml-1 font-bold text-[var(--color-text-secondary)]">@{fieldName}</span>
        ) : null}
      </div>
      <p
        className="overflow-hidden whitespace-pre-wrap pr-7 text-base font-medium leading-7 text-[var(--color-text-primary)]"
        ref={contentRef}
        style={expanded ? undefined : { maxHeight: "5.25rem" }}
      >
        {note.tags.map((tag) => (
          <span
            className="mr-1.5 inline-flex h-[25px] items-center rounded-[7px] bg-[var(--color-accent-soft)] px-2 text-[13px] font-semibold text-[var(--color-accent)]"
            key={tag}
          >
            #{tag}
          </span>
        ))}
        {note.content}
      </p>
      {hasOverflow || expanded ? (
        <button
          className="mt-3 text-sm font-semibold text-[var(--color-accent)]"
          type="button"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "收起" : "展开"}
        </button>
      ) : null}
    </article>
  );
}

/** Renders a single statistic block in the sidebar. */
function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[30px] font-bold leading-none text-[var(--color-text-secondary)]">
        {value}
      </div>
      <div className="mt-2 text-[13px] text-[var(--color-text-muted)]">{label}</div>
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
      <h2 className="mb-3 text-xs font-normal tracking-[0.02em] text-[var(--color-warm)]">
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
  disabled = false,
  label,
  onClick,
  prefix,
}: {
  active: boolean;
  count: number;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  prefix: string;
}) {
  return (
    <button
      className="grid min-h-9 grid-cols-[24px_1fr_auto] items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[15px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent data-[active=true]:bg-[var(--color-accent-soft)] data-[active=true]:text-[var(--color-text-primary)] data-[active=true]:shadow-[inset_0_0_0_1px_var(--color-border-strong)]"
      data-active={active}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <span className="text-center text-lg font-bold leading-none text-[var(--color-accent)]">
        {prefix}
      </span>
      <span className="min-w-0 truncate">{label}</span>
      <span className="text-xs text-[var(--color-text-muted)]">{count}</span>
    </button>
  );
}

/** Applies current home feed filters to recent notes. */
function filterVisibleNotes(
  notes: NoteDto[],
  query: { fieldId?: string; keyword: string; tag?: string },
): NoteDto[] {
  const keyword = query.keyword.trim();

  return notes.filter((note) => {
    const keywordMatched = !keyword || note.content.includes(keyword);
    const tagMatched = !query.tag || note.tags.includes(query.tag);
    const fieldMatched = !query.fieldId || note.fieldId === query.fieldId;
    return keywordMatched && tagMatched && fieldMatched;
  });
}

/** Counts tag usage in recent notes for the sidebar tag navigation. */
function countTags(notes: NoteDto[]): Map<string, number> {
  const counts = new Map<string, number>();

  notes.forEach((note) => {
    note.tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return counts;
}

/** Extracts inline tag names from composer content. */
function parseTagNames(content: string): string[] {
  return Array.from(
    content.matchAll(/(?:^|\s)#([^\s#@]+)/g),
    (match) => match[1],
  );
}

/** Formats a Unix timestamp for note card metadata. */
function formatNoteTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const parts = new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")} ${value(
    "hour",
  )}:${value("minute")}`;
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
  ];
}

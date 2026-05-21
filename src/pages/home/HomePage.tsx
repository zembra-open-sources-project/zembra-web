import {
  AtSign,
  Bold,
  CalendarDays,
  CircleHelp,
  Hash,
  List,
  MoreHorizontal,
  Search,
  SendHorizontal,
  Settings,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "../../app/ThemeToggle";
import {
  KeyboardEvent,
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
import type { DailyNoteCount, NoteDto } from "../../api/types";

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

/** Renders the redesigned Zembra note workspace shell. */
export function HomePage() {
  const { i18n, t } = useTranslation("home");
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string>();
  const [editDraft, setEditDraft] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    notes,
    dailyNoteCounts,
    fields,
    tags,
    keyword,
    selectedTag,
    selectedField,
    setKeyword,
    setSelectedTag,
    setSelectedField,
    createNote,
    loadDailyNoteCounts,
    loadFields,
    loadRecentNotes,
    loadTags,
    deleteNote,
    updateNote,
  } = useNotesStore();

  const composerTools = useMemo(
    () => createComposerTools(t),
    [t],
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
  const editFieldNames = useMemo(() => parseFieldNames(editDraft), [editDraft]);
  const editWarning =
    editFieldNames.length > 1
      ? t("note.edit.warningMultipleFields", { field: editFieldNames[0] })
      : undefined;

  useEffect(() => {
    void loadDailyNoteCounts();
    void loadFields();
    void loadTags();
    void loadRecentNotes();
  }, [loadDailyNoteCounts, loadFields, loadRecentNotes, loadTags]);

  /** Persists the current composer draft as a new note. */
  async function handleCreateSubmit() {
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

  /** Starts editing a note when no other card owns a draft. */
  function handleEditStart(note: NoteDto) {
    if (editingNoteId && editingNoteId !== note.id) {
      return;
    }

    setEditingNoteId(note.id);
    setEditDraft(note.content);
  }

  /** Cancels the current note edit draft. */
  function handleEditCancel() {
    setEditingNoteId(undefined);
    setEditDraft("");
  }

  /** Persists the current edit draft and exits edit mode on success. */
  async function handleEditSubmit() {
    if (!editingNoteId) {
      return;
    }

    const content = editDraft.trim();

    if (!content) {
      return;
    }

    const fieldNames = parseFieldNames(content);

    setIsUpdating(true);
    try {
      await updateNote(editingNoteId, {
        content,
        field: fieldNames[0] ?? null,
        tags: parseTagNames(content),
      });
      handleEditCancel();
    } finally {
      setIsUpdating(false);
    }
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
                  {t("badge.local")}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
                  type="button"
                  aria-label={t("composer.help")}
                  title={t("composer.help")}
                >
                  <CircleHelp
                    className="size-4 text-[var(--color-accent)]"
                    aria-hidden="true"
                  />
                </button>
                <ThemeToggle />
                <Link
                  className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
                  title={t("form.settings.title", { ns: "settings" })}
                  to="/settings/sync"
                  aria-label={t("form.settings.title", { ns: "settings" })}
                >
                  <Settings
                    className="size-4 text-[var(--color-accent)]"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>

            <div className="mb-5 hidden grid-cols-3 gap-4 lg:grid">
              <StatBlock label={t("stats.notes")} value={String(notes.length)} />
              <StatBlock label={t("stats.tags")} value={String(tags.length)} />
              <StatBlock label={t("stats.fields")} value={String(fields.length)} />
            </div>

            <DailyNotesHeatmap days={dailyNoteCounts} locale={i18n.resolvedLanguage} />
          </div>

          <div className="hidden min-h-0 flex-1 overflow-y-auto pb-44 pr-1 lg:block">
            <SidebarSection className="mt-4" title={t("sidebar.fields")}>
              <NavItem
                active={selectedField === undefined}
                count={fields.length}
                label={t("sidebar.all")}
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

            <SidebarSection title={t("sidebar.tags")}>
              {tags.length === 0 ? (
                <NavItem
                  active={false}
                  count={0}
                  disabled
                  label={t("sidebar.emptyTags")}
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
                placeholder={t("search.placeholder")}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <span className="text-[var(--color-text-muted)]">⌘+K</span>
            </label>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto pb-44">
            <div className="flex flex-col gap-3.5">
            {visibleNotes.length === 0 ? (
              <article className="rounded-[18px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-8 text-[var(--color-text-muted)]">
                {t("note.empty")}
              </article>
            ) : null}
            {visibleNotes.map((note) => (
              <NoteCard
                canStartEditing={!editingNoteId || editingNoteId === note.id}
                editDraft={editingNoteId === note.id ? editDraft : undefined}
                editWarning={editingNoteId === note.id ? editWarning : undefined}
                onDelete={deleteNote}
                onEditCancel={handleEditCancel}
                onEditDraftChange={setEditDraft}
                onEditStart={handleEditStart}
                onEditSubmit={handleEditSubmit}
                fieldName={note.fieldId ? fieldNameById.get(note.fieldId) : undefined}
                isEditing={editingNoteId === note.id}
                isUpdating={isUpdating}
                key={note.id}
                locale={i18n.resolvedLanguage}
                note={note}
                tools={composerTools}
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
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateSubmit();
          }}
        >
          <div className="min-w-0 lg:col-start-2">
            <NoteEditor
              draft={draft}
              isSubmitting={isSubmitting}
              meta={t("composer.saveTo", {
                field:
                  fields.find((field) => field.id === selectedField)?.name ??
                  "Inbox",
              })}
              placeholder={t("composer.placeholder")}
              submitLabel={t("composer.send")}
              tools={composerTools}
              variant="floating"
              onDraftChange={setDraft}
            />
          </div>
        </form>
      </div>

    </main>
  );
}

/** Renders the recent daily note count calendar heatmap in the sidebar. */
function DailyNotesHeatmap({
  days,
  locale = "zh-CN",
}: {
  days: DailyNoteCount[];
  locale?: string;
}) {
  const { t } = useTranslation("home");
  const maxCount = Math.max(0, ...days.map((day) => day.count));

  if (days.length === 0) {
    return (
      <section
        aria-label={t("heatmap.ariaLabel")}
        className="hidden w-[300px] rounded-[12px] border border-dashed border-[var(--color-border)] px-3 py-3 text-sm text-[var(--color-text-muted)] lg:block"
      >
        {t("heatmap.empty")}
      </section>
    );
  }

  return (
    <section
      aria-label={t("heatmap.ariaLabel")}
      className="hidden w-[300px] lg:block"
    >
      <div className="mb-2 flex items-center justify-between gap-3 text-[13px] text-[var(--color-text-muted)]">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
          <span className="truncate">{t("heatmap.title")}</span>
        </span>
        <span className="shrink-0">{t("heatmap.days", { count: days.length })}</span>
      </div>
      <div className="grid grid-flow-col grid-rows-5 gap-[7px]">
        {days.map((day) => {
          const level = getHeatmapLevel(day.count, maxCount);
          const label = t("heatmap.dayLabel", {
            count: day.count,
            date: formatHeatmapDate(day.date, locale),
          });

          return (
            <span
              aria-label={label}
              className="flex h-[35px] min-w-0 items-center justify-center rounded-[6px] bg-[var(--color-surface-muted)] text-[10px] font-semibold leading-none text-[var(--color-text-muted)] shadow-[inset_0_0_0_1px_var(--color-border-subtle)] data-[level='1']:bg-[color-mix(in_srgb,var(--color-accent)_18%,var(--color-surface-muted))] data-[level='2']:bg-[color-mix(in_srgb,var(--color-accent)_34%,var(--color-surface-muted))] data-[level='3']:bg-[color-mix(in_srgb,var(--color-accent)_58%,var(--color-surface-muted))] data-[level='4']:bg-[var(--color-accent)] data-[level='4']:text-[var(--color-accent-contrast)]"
              data-level={level}
              key={day.date}
              title={label}
            >
              {Number(day.date.slice(-2))}
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-[var(--color-text-muted)]">
        <span>{formatHeatmapDate(days[0]?.date, locale)}</span>
        <span>{formatHeatmapDate(days.at(-1)?.date, locale)}</span>
      </div>
    </section>
  );
}

/** Renders one recent note in the home feed. */
function NoteCard({
  canStartEditing,
  editDraft,
  editWarning,
  fieldName,
  isEditing,
  isUpdating,
  locale,
  note,
  onDelete,
  onEditCancel,
  onEditDraftChange,
  onEditStart,
  onEditSubmit,
  tools,
}: {
  canStartEditing: boolean;
  editDraft?: string;
  editWarning?: string;
  fieldName?: string;
  isEditing: boolean;
  isUpdating: boolean;
  locale?: string;
  note: NoteDto;
  onDelete: (noteId: string) => Promise<void>;
  onEditCancel: () => void;
  onEditDraftChange: (draft: string) => void;
  onEditStart: (note: NoteDto) => void;
  onEditSubmit: () => Promise<void>;
  tools: ComposerTool[];
}) {
  const { t } = useTranslation("home");
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  /** Deletes this note through the notes client and closes the action menu. */
  async function handleDeleteClick() {
    setIsDeleting(true);
    try {
      await onDelete(note.id);
      setIsActionsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  /** Enters edit mode when this card is allowed to own the draft. */
  function handleDoubleClick() {
    if (!isEditing && canStartEditing) {
      onEditStart(note);
    }
  }

  return (
    <article
      className="relative rounded-[18px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-5 py-[18px]"
      onDoubleClick={handleDoubleClick}
    >
      {!isEditing ? (
      <div className="absolute right-[12px] top-[11px]">
        <button
          aria-expanded={isActionsOpen}
          aria-label={t("note.actions")}
          className="flex size-9 items-center justify-center rounded-[9px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
          onClick={() => setIsActionsOpen((current) => !current)}
          type="button"
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
        </button>
        {isActionsOpen ? (
          <div className="absolute right-0 top-10 z-30 min-w-28 overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--color-shadow-float)]">
            <button
              className="block w-full px-3 py-2 text-left text-sm text-[var(--color-error)] hover:bg-[var(--color-error-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting}
              onClick={handleDeleteClick}
              type="button"
            >
              {isDeleting ? t("note.deleting") : t("note.delete")}
            </button>
          </div>
        ) : null}
      </div>
      ) : null}
      <div className="mb-3.5 text-[13px] text-[var(--color-text-muted)]">
        {formatNoteTimestamp(note.updatedAt, locale)}
        {fieldName ? (
          <span className="ml-1 font-bold text-[var(--color-text-secondary)]">@{fieldName}</span>
        ) : null}
      </div>
      {isEditing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onEditSubmit();
          }}
        >
          <NoteEditor
            draft={editDraft ?? ""}
            isSubmitting={isUpdating}
            placeholder={t("composer.placeholder")}
            submitLabel={isUpdating ? t("note.edit.saving") : t("composer.send")}
            tools={tools}
            variant="embedded"
            warning={editWarning}
            onCancel={onEditCancel}
            onDraftChange={onEditDraftChange}
          />
        </form>
      ) : (
      <>
      <p
        className="overflow-hidden whitespace-pre-wrap pr-7 text-base leading-7 text-[var(--color-text-primary)]"
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
          {expanded ? t("note.collapse") : t("note.expand")}
        </button>
      ) : null}
      </>
      )}
    </article>
  );
}

/** Renders a reusable note text editor shared by creation and card editing. */
function NoteEditor({
  draft,
  isSubmitting,
  meta,
  onCancel,
  onDraftChange,
  placeholder,
  submitLabel,
  tools,
  variant,
  warning,
}: {
  draft: string;
  isSubmitting: boolean;
  meta?: string;
  onCancel?: () => void;
  onDraftChange: (draft: string) => void;
  placeholder: string;
  submitLabel: string;
  tools: ComposerTool[];
  variant: "floating" | "embedded";
  warning?: string;
}) {
  const { t } = useTranslation("home");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Handles keyboard shortcuts scoped to this editor. */
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      onCancel();
    }
  }

  /** Inserts a toolbar snippet into this editor's draft. */
  function handleToolClick(
    event: MouseEvent<HTMLButtonElement>,
    tool: ComposerTool,
  ) {
    event.preventDefault();
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

    onDraftChange(nextDraft);
    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  return (
    <div
      className={[
        "overflow-hidden rounded-[18px] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)]",
        variant === "floating"
          ? "shadow-[var(--color-shadow-float)] backdrop-blur"
          : "shadow-[inset_0_0_0_1px_var(--color-border-subtle)]",
      ].join(" ")}
    >
      <textarea
        className="min-h-[54px] w-full resize-none bg-transparent px-[18px] pb-1.5 pt-4 text-base font-medium leading-6 text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        placeholder={placeholder}
        ref={textareaRef}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {warning ? (
        <div className="mx-4 mb-2 rounded-[9px] border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] px-3 py-2 text-sm text-[var(--color-warning)]">
          {warning}
        </div>
      ) : null}
      <div className="flex items-end justify-between gap-3 px-4 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-4 text-[var(--color-text-secondary)]">
            {tools.map((tool) => (
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
          {meta ? (
            <div className="mt-1.5 truncate text-xs text-[var(--color-text-muted)]">
              {meta}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onCancel ? (
            <button
              className="h-[34px] rounded-[10px] px-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
              type="button"
              onClick={onCancel}
            >
              {t("note.edit.cancel")}
            </button>
          ) : null}
          <button
            className="flex h-[34px] min-w-12 items-center justify-center rounded-[10px] bg-[var(--color-accent)] px-3 text-[var(--color-accent-contrast)] shadow-[0_8px_18px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            aria-label={submitLabel}
            disabled={isSubmitting || draft.trim().length === 0}
          >
            <SendHorizontal className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
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
  className = "mt-6",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section className={className}>
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

/** Extracts inline field names from note content in document order. */
function parseFieldNames(content: string): string[] {
  return Array.from(
    content.matchAll(/(?:^|\s)@([^\s#@]+)/g),
    (match) => match[1],
  );
}

/** Formats a Unix timestamp for note card metadata. */
function formatNoteTimestamp(timestamp: number, locale = "zh-CN"): string {
  const date = new Date(timestamp * 1000);
  const parts = new Intl.DateTimeFormat(locale, {
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

/** Maps a daily note count to a visual heatmap intensity level. */
function getHeatmapLevel(count: number, maxCount: number): number {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }

  return Math.min(4, Math.max(1, Math.ceil((count / maxCount) * 4)));
}

/** Formats a YYYY-MM-DD heatmap date for compact sidebar labels. */
function formatHeatmapDate(dateKey: string | undefined, locale = "zh-CN"): string {
  if (!dateKey) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${dateKey}T00:00:00`));
}

/** Creates toolbar definitions for the composer insertion buttons. */
function createComposerTools(t: (key: string) => string): ComposerTool[] {
  return [
    {
      id: "tag",
      label: t("composer.tools.tag"),
      icon: <Hash className="size-5" aria-hidden="true" />,
      before: "#",
    },
    {
      id: "field",
      label: t("composer.tools.field"),
      icon: <AtSign className="size-5" aria-hidden="true" />,
      before: "@",
    },
    {
      id: "bold",
      label: t("composer.tools.bold"),
      icon: <Bold className="size-4" aria-hidden="true" />,
      before: "**",
      after: "**",
      cursorOffset: 2,
    },
    {
      id: "list",
      label: t("composer.tools.list"),
      icon: <List className="size-5" aria-hidden="true" />,
      before: "\n- ",
    },
  ];
}

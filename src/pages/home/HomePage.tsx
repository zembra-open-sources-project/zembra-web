import {
  AtSign,
  Bold,
  CircleHelp,
  Hash,
  List,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "../../app/ThemeToggle";
import { useEffect, useMemo, useState } from "react";
import { syncClient as defaultSyncClient } from "../../api/client";
import { ApiError } from "../../api/http";
import type { SyncClient } from "../../api/sync.client";
import { useNotesStore } from "../../features/notes/noteStore";
import type { NoteDto } from "../../api/types";
import { SettingsModule } from "../settings/SettingsModule";
import { NoteCard } from "./NoteCard";
import { NoteEditor } from "./NoteEditor";
import {
  DailyNotesHeatmap,
  NavItem,
  SidebarSection,
  StatBlock,
} from "./HomeSidebar";
import type { ComposerTool } from "./homeTypes";
import {
  countFields,
  countTags,
  filterVisibleNotes,
  parseFieldNames,
  parseNoteLinks,
  parseTagNames,
} from "./homeUtils";

interface HomePageProps {
  /** Optional synchronization client override used by tests. */
  syncClient?: SyncClient;
}

/** Renders the redesigned Zembra note workspace shell. */
export function HomePage({ syncClient = defaultSyncClient }: HomePageProps) {
  const { i18n, t } = useTranslation("home");
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string>();
  const [editDraft, setEditDraft] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | undefined>();
  const [syncError, setSyncError] = useState<string | undefined>();
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
    loadNotePreview,
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
  const fieldUsage = useMemo(() => countFields(notes), [notes]);
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
    const links = parseNoteLinks(content);

    setIsSubmitting(true);
    try {
      await createNote({
        content,
        field,
        links,
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

  /** Inserts a note mention into the active editor draft. */
  function handleMentionNote(noteId: string) {
    const mention = `[[${noteId}]]`;

    if (editingNoteId) {
      setEditDraft((current) =>
        current.trim().length > 0 ? `${current} ${mention}` : mention,
      );
      return;
    }

    setDraft((current) =>
      current.trim().length > 0 ? `${current} ${mention}` : mention,
    );
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
        links: parseNoteLinks(content),
        tags: parseTagNames(content),
      });
      handleEditCancel();
    } finally {
      setIsUpdating(false);
    }
  }

  /** Triggers a manual synchronization cycle from the home workspace. */
  async function handleManualSync() {
    setIsSyncing(true);
    setSyncFeedback(undefined);
    setSyncError(undefined);

    try {
      const result = await syncClient.runSync();
      setSyncFeedback(
        t("actions.syncSummary", {
          pulled: result.pulled,
          pushed: result.pushed,
        }),
      );
    } catch (error) {
      setSyncError(formatErrorMessage(error));
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-[var(--color-app-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto grid h-full w-full max-w-[1156px] grid-cols-1 gap-4 px-5 pt-1 lg:grid-cols-[300px_760px] lg:gap-16 lg:px-0">
        <aside className="flex min-h-0 min-w-0 flex-col lg:min-h-0">
          <div className="shrink-0">
            <div className="mb-3 flex items-center justify-between gap-3">
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
                <button
                  className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  aria-label={t("actions.sync")}
                  title={t("actions.sync")}
                  disabled={isSyncing}
                  onClick={() => void handleManualSync()}
                >
                  {isSyncing ? (
                    <Loader2
                      className="size-4 animate-spin text-[var(--color-accent)]"
                      aria-hidden="true"
                    />
                  ) : (
                    <RefreshCw
                      className="size-4 text-[var(--color-accent)]"
                      aria-hidden="true"
                    />
                  )}
                </button>
                <ThemeToggle />
                <SettingsModule client={syncClient} />
              </div>
            </div>

            {syncFeedback || syncError ? (
              <p
                className="mb-3 rounded-[10px] border px-3 py-2 text-sm data-[tone=error]:border-[var(--color-error-border)] data-[tone=error]:bg-[var(--color-error-soft)] data-[tone=error]:text-[var(--color-error)] data-[tone=success]:border-[var(--color-success-border)] data-[tone=success]:bg-[var(--color-success-soft)] data-[tone=success]:text-[var(--color-accent)]"
                data-tone={syncError ? "error" : "success"}
                role="status"
              >
                {syncError ?? syncFeedback}
              </p>
            ) : null}

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
                count={notes.length}
                label={t("sidebar.all")}
                prefix="@"
                onClick={() => setSelectedField(undefined)}
              />
              {fields.map((field) => (
                <NavItem
                  active={selectedField === field.id}
                  count={fieldUsage.get(field.id) ?? 0}
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
          <header className="mb-4 flex min-h-11 shrink-0 items-center justify-end lg:mb-3">
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
            <div className="flex flex-col gap-2">
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
                  onLoadNotePreview={loadNotePreview}
                  onMention={handleMentionNote}
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

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-5 lg:px-0">
        <div className="mx-auto grid h-[154px] w-full max-w-[1156px] grid-cols-1 lg:grid-cols-[300px_760px] lg:gap-16">
          <div className="min-w-0 bg-[image:var(--color-composer-gradient)] lg:col-start-2" />
        </div>
      </div>

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

/** Formats an unknown thrown value into a short user-facing message. */
function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}

/** Creates toolbar definitions for the composer insertion buttons. */
function createComposerTools(t: (key: string) => string): ComposerTool[] {
  return [
    {
      id: "tag",
      label: t("composer.tools.tag"),
      icon: <Hash className="size-5" aria-hidden="true" />,
      before: "#",
      cursorOffset: 1,
    },
    {
      id: "field",
      label: t("composer.tools.field"),
      icon: <AtSign className="size-5" aria-hidden="true" />,
      before: "@",
      cursorOffset: 1,
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
      before: "- ",
      cursorOffset: 2,
    },
  ];
}

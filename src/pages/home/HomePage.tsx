import {
  AtSign,
  Bold,
  Bot,
  CircleHelp,
  Hash,
  List,
  Search,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "../../app/ThemeToggle";
import { useWorkspace } from "../../app/workspace-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaultFieldName } from "../../api/defaultField";
import {
  SourceHomeControlsProvider,
  SourceStatusFeedback,
  SourceToolbarActions,
} from "@zembra/source-home-controls";
import { useNotesStore } from "../../features/notes/noteStore";
import type { FieldDto, NoteDto, TagDto } from "../../api/types";
import { NoteCard } from "./NoteCard";
import { NoteEditor, type NoteEditorHandle } from "./NoteEditor";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import {
  DailyNotesHeatmap,
  NavItem,
  SidebarSection,
  StatBlock,
  TagTreeItem,
} from "./HomeSidebar";
import type { ComposerTool } from "./homeTypes";
import { normalizeMarkdownSource } from "./liveMarkdownEditorUtils";
import {
  buildTagFilterMatch,
  buildTagTree,
  countFields,
  countRoles,
  countTags,
  findSelectedTagRootPath,
  filterVisibleNotes,
  noteMatchesTagPath,
  parseFieldNames,
  parseNoteLinks,
  parseTagNames,
  sortNotesByCreatedAt,
} from "./homeUtils";

/** Renders the redesigned Zembra note workspace shell. */
export function HomePage() {
  const { i18n, t } = useTranslation("home");
  const composerRef = useRef<NoteEditorHandle>(null);
  const { workspace, workspaces, switchWorkspace, renameWorkspace } = useWorkspace();
  const [draft, setDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string>();
  const [editDraft, setEditDraft] = useState("");
  const [pendingDeleteField, setPendingDeleteField] = useState<FieldDto>();
  const [pendingDeleteTag, setPendingDeleteTag] = useState<TagDto>();

  useEffect(() => {
    document.title = `${workspace.title} - Zembra`;
  }, [workspace.title]);

  const {
    notes,
    roleNavigationNotes,
    dailyNoteCounts,
    fields,
    tags,
    keyword,
    selectedTag,
    selectedField,
    selectedRole,
    setKeyword,
    setSelectedTag,
    setSelectedField,
    setSelectedRole,
    createNote,
    loadDailyNoteCounts,
    loadFields,
    loadNotePreview,
    loadRecentNotes,
    loadTags,
    deleteNote,
    deleteField,
    deleteTagTree,
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
  const tagUsage = useMemo(() => countTags(notes), [notes]);
  const tagTree = useMemo(() => buildTagTree(tags), [tags]);
  const selectedTagMatch = useMemo(
    () => buildTagFilterMatch(tagTree, selectedTag),
    [selectedTag, tagTree],
  );
  const visibleNotes = useMemo(
    () =>
      sortNotesByCreatedAt(
        filterVisibleNotes(notes, {
          fieldId: selectedField,
          keyword,
          tag: selectedTag,
          tagMatch: selectedTagMatch,
        }),
      ),
    [keyword, notes, selectedField, selectedTag, selectedTagMatch],
  );
  const fieldUsage = useMemo(() => countFields(notes), [notes]);
  const roleUsage = useMemo(
    () => countRoles(roleNavigationNotes.length > 0 ? roleNavigationNotes : notes),
    [notes, roleNavigationNotes],
  );
  const roleTotalCount = roleNavigationNotes.length > 0
    ? roleNavigationNotes.length
    : notes.length;
  const editFieldNames = useMemo(() => parseFieldNames(editDraft), [editDraft]);
  const editWarning =
    editFieldNames.length > 1
      ? t("note.edit.warningMultipleFields", { field: editFieldNames[0] })
      : undefined;
  const [expandedTagRoots, setExpandedTagRoots] = useState<Set<string>>(
    () => new Set(),
  );
  useEffect(() => {
    void loadFields();
    void loadTags();
    void loadRecentNotes();
  }, [loadFields, loadRecentNotes, loadTags, workspace.id]);

  useEffect(() => {
    const rootPath = findSelectedTagRootPath(tagTree, selectedTag);

    if (!rootPath) {
      return;
    }

    setExpandedTagRoots((current) => {
      if (current.has(rootPath)) {
        return current;
      }

      const next = new Set(current);
      next.add(rootPath);
      return next;
    });
  }, [selectedTag, tagTree]);

  /** Persists the current composer draft as a new note. */
  async function handleCreateSubmit() {
    const content = draft.trim();

    if (!content) {
      return;
    }

    const fieldNames = parseFieldNames(content);
    const field =
      fieldNames[0] ??
      fields.find((item) => item.id === selectedField)?.name ??
      defaultFieldName;
    const tags = parseTagNames(content);
    const links = parseNoteLinks(content);

    void createNote({
      content,
      field,
      links,
      role: "Human",
      tags,
    }).catch(() => undefined);
    setDraft("");
    composerRef.current?.clear();
  }

  /** Toggles one root tag branch in the sidebar tree. */
  function handleTagRootToggle(path: string) {
    setExpandedTagRoots((current) => {
      const next = new Set(current);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return next;
    });
  }

  /** Clears every sidebar classification filter and restores all recent notes. */
  async function handleAllNotesSelect() {
    setSelectedField(undefined);
    setSelectedTag(undefined);

    if (selectedRole !== undefined) {
      await setSelectedRole(undefined);
    }
  }

  /** Selects one role and removes active field and tag filters. */
  async function handleRoleSelect(role: string) {
    setSelectedField(undefined);
    setSelectedTag(undefined);
    await setSelectedRole(role);
  }

  /** Selects one field and removes active role and tag filters. */
  async function handleFieldSelect(fieldId: string) {
    setSelectedTag(undefined);
    setSelectedField(fieldId);

    if (selectedRole !== undefined) {
      await setSelectedRole(undefined);
    }
  }

  /** Selects one tag and removes active role and field filters. */
  async function handleTagSelect(path: string) {
    setSelectedField(undefined);
    setSelectedTag(path);

    if (selectedRole !== undefined) {
      await setSelectedRole(undefined);
    }
  }

  /** Starts editing a note when no other card owns a draft. */
  function handleEditStart(note: NoteDto) {
    if (editingNoteId && editingNoteId !== note.id) {
      return;
    }

    setEditingNoteId(note.id);
    setEditDraft(normalizeMarkdownSource(note.content));
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

  /** Optimistically persists the current edit draft and immediately exits edit mode. */
  function handleEditSubmit() {
    if (!editingNoteId) {
      return;
    }

    const content = editDraft.trim();

    if (!content) {
      return;
    }

    const fieldNames = parseFieldNames(content);

    const existingFieldName = fieldNameById.get(
      notes.find((note) => note.id === editingNoteId)?.fieldId ?? "",
    );

    void updateNote(editingNoteId, {
      content,
      field: fieldNames[0] ?? existingFieldName ?? defaultFieldName,
      links: parseNoteLinks(content),
      tags: parseTagNames(content),
    });
    handleEditCancel();
  }

  /** Persists a field-only change for one note without changing navigation filters. */
  function handleNoteFieldChange(note: NoteDto, field: string) {
    void updateNote(note.id, {
      content: note.content,
      field,
      links: parseNoteLinks(note.content),
      tags: parseTagNames(note.content),
    });
  }

  /** Opens the in-app confirmation dialog for deleting an unused field. */
  function handleFieldDeleteRequest(field: FieldDto) {
    setPendingDeleteField(field);
  }

  /** Closes the field deletion dialog. */
  function handleFieldDeleteCancel() {
    setPendingDeleteField(undefined);
  }

  /** Optimistically removes the pending unused field and queues deletion. */
  function handleFieldDeleteConfirm() {
    if (!pendingDeleteField) {
      return;
    }

    void deleteField(pendingDeleteField.id);
    setPendingDeleteField(undefined);
  }

  /** Opens the in-app confirmation dialog for deleting an empty tag subtree. */
  function handleTagDeleteRequest(tag: TagDto) {
    setPendingDeleteTag(tag);
  }

  /** Closes the tag deletion dialog. */
  function handleTagDeleteCancel() {
    setPendingDeleteTag(undefined);
  }

  /** Optimistically removes the pending empty tag subtree and queues deletion. */
  function handleTagDeleteConfirm() {
    if (!pendingDeleteTag) {
      return;
    }

    void deleteTagTree(pendingDeleteTag.path);
    setPendingDeleteTag(undefined);
  }

  return (
    <SourceHomeControlsProvider>
    <main className="h-screen overflow-hidden bg-[var(--color-app-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto grid h-full w-full max-w-[var(--layout-shell-max)] grid-cols-1 gap-[var(--space-4)] px-[var(--space-5)] pt-[var(--space-1)] lg:grid-cols-[minmax(var(--layout-sidebar-min),var(--layout-sidebar-max))_minmax(var(--layout-content-min),var(--layout-content-max))] lg:px-0">
        <aside className="flex min-h-0 min-w-0 flex-col lg:min-h-0">
          <div className="shrink-0">
            <div className="mb-[var(--space-3)] flex items-center justify-between gap-[var(--space-3)]">
              <div className="flex min-w-0 items-center gap-[var(--space-2)] text-lg font-bold">
                <span className="text-[2em] leading-none">ℤ</span>
                <WorkspaceSwitcher
                  workspace={workspace}
                  workspaces={workspaces}
                  onWorkspaceChange={switchWorkspace}
                  onWorkspaceRename={renameWorkspace}
                />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="flex size-[var(--icon-hit-size)] shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
                  type="button"
                  aria-label={t("composer.help")}
                  title={t("composer.help")}
                >
                  <CircleHelp
                    className="size-[var(--icon-size)] text-[var(--color-accent)]"
                    aria-hidden="true"
                  />
                </button>
                <SourceToolbarActions />
                <ThemeToggle />
              </div>
            </div>

            <SourceStatusFeedback />

            <div className="mb-5 hidden grid-cols-3 gap-4 lg:grid">
              <StatBlock label={t("stats.notes")} value={String(notes.length)} />
              <StatBlock label={t("stats.tags")} value={String(tags.length)} />
              <StatBlock label={t("stats.fields")} value={String(fields.length)} />
            </div>

            <DailyNotesHeatmap
              days={dailyNoteCounts}
              locale={i18n.resolvedLanguage}
              onDayCountChange={loadDailyNoteCounts}
              workspaceId={workspace.id}
            />
          </div>

          <div className="hidden min-h-0 flex-1 overflow-y-auto pb-44 pr-1 pt-4 lg:block">
            <NavItem
              active={
                selectedRole === undefined &&
                selectedField === undefined &&
                selectedTag === undefined
              }
              count={roleTotalCount}
              label={t("sidebar.allNotes")}
              prefix={<List className="size-4" aria-hidden="true" />}
              onClick={() => void handleAllNotesSelect()}
            />
            <SidebarSection className="mt-4" title={t("sidebar.roles")}>
              {Array.from(roleUsage.entries()).map(([role, count]) => {
                const label = role || t("sidebar.unknownRole");

                return (
                  <NavItem
                    active={selectedRole === role}
                    count={count}
                    key={role || "unknown-role"}
                    label={label}
                    prefix={
                      role === "Human" ? (
                        <User className="size-4" aria-hidden="true" />
                      ) : (
                        <Bot className="size-4" aria-hidden="true" />
                      )
                    }
                    onClick={() => void handleRoleSelect(role)}
                  />
                );
              })}
            </SidebarSection>

            <SidebarSection title={t("sidebar.fields")}>
              {fields.map((field) => (
                <NavItem
                  active={selectedField === field.id}
                  count={fieldUsage.get(field.id) ?? 0}
                  deleteDisabled={false}
                  deleteLabel={
                    (fieldUsage.get(field.id) ?? 0) === 0
                      ? t("field.delete.action", { field: field.name })
                      : undefined
                  }
                  key={field.id}
                  label={field.name}
                  prefix="@"
                  onDelete={
                    (fieldUsage.get(field.id) ?? 0) === 0
                      ? () => handleFieldDeleteRequest(field)
                      : undefined
                  }
                  onClick={() => void handleFieldSelect(field.id)}
                />
              ))}
            </SidebarSection>

            <SidebarSection title={t("sidebar.tags")}>
              {tagTree.length === 0 ? (
                <NavItem
                  active={false}
                  count={0}
                  disabled
                  label={t("sidebar.emptyTags")}
                  prefix="#"
                  onClick={() => undefined}
                />
              ) : null}
              {tagTree.map((node) => (
                <TagTreeItem
                  activePath={selectedTag}
                  childCounts={tagUsage}
                  collapsedLabel={t("sidebar.expandTag", {
                    tag: node.tag.name,
                  })}
                  expanded={expandedTagRoots.has(node.tag.path)}
                  expandedLabel={t("sidebar.collapseTag", {
                    tag: node.tag.name,
                  })}
                  getDeleteLabel={(tag, count) =>
                    count === 0 ? t("tag.delete.action", { tag: tag.path }) : undefined
                  }
                  key={node.tag.path}
                  node={node}
                  rootCount={Math.max(
                    notes.filter((note) =>
                      noteMatchesTagPath(note.tags, node.tag.path),
                    ).length,
                    (tagUsage.get(node.tag.path) ?? tagUsage.get(node.tag.name) ?? 0) +
                      node.children.reduce(
                        (total, child) =>
                          total + (tagUsage.get(child.path) ?? tagUsage.get(child.name) ?? 0),
                        0,
                      ),
                  )}
                  onDelete={handleTagDeleteRequest}
                  onSelect={(path) => void handleTagSelect(path)}
                  onToggle={handleTagRootToggle}
                />
              ))}
            </SidebarSection>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <header className="mb-4 flex min-h-11 shrink-0 items-center justify-end lg:mb-3">
            <label className="flex h-[var(--control-height)] w-full items-center gap-[var(--space-2)] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-4)] text-sm text-[var(--color-text-muted)] lg:max-w-80">
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
            <div className="flex flex-col gap-[var(--space-3)]">
              {visibleNotes.length === 0 ? (
                <article className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-5)] text-[var(--color-text-muted)]">
                  {t("note.empty")}
                </article>
              ) : null}
              {visibleNotes.map((note) => (
                <NoteCard
                  canStartEditing={!editingNoteId || editingNoteId === note.id}
                  editDraft={editingNoteId === note.id ? editDraft : undefined}
                  editWarning={editingNoteId === note.id ? editWarning : undefined}
                  fields={fields}
                  onDelete={deleteNote}
                  onEditCancel={handleEditCancel}
                  onEditDraftChange={setEditDraft}
                  onEditStart={handleEditStart}
                  onEditSubmit={handleEditSubmit}
                  onFieldChange={handleNoteFieldChange}
                  onLoadNotePreview={loadNotePreview}
                  onMention={handleMentionNote}
                  fieldName={note.fieldId ? fieldNameById.get(note.fieldId) : undefined}
                  isEditing={editingNoteId === note.id}
                  key={note.id}
                  locale={i18n.resolvedLanguage}
                  note={note}
                  tags={tags}
                  tools={composerTools}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-5 lg:px-0">
        <div className="mx-auto grid h-[154px] w-full max-w-[var(--layout-shell-max)] grid-cols-1 gap-[var(--space-4)] lg:grid-cols-[minmax(var(--layout-sidebar-min),var(--layout-sidebar-max))_minmax(var(--layout-content-min),var(--layout-content-max))]">
          <div className="min-w-0 bg-[image:var(--color-composer-gradient)] lg:col-start-2" />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-6 z-20 px-5 lg:px-0">
        <form
          className="mx-auto grid w-full max-w-[var(--layout-shell-max)] grid-cols-1 gap-[var(--space-4)] lg:grid-cols-[minmax(var(--layout-sidebar-min),var(--layout-sidebar-max))_minmax(var(--layout-content-min),var(--layout-content-max))]"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateSubmit();
          }}
        >
          <div className="min-w-0 lg:col-start-2">
            <NoteEditor
              ref={composerRef}
              draft={draft}
              isSubmitting={false}
              meta={t("composer.saveTo", {
                field:
                  fields.find((field) => field.id === selectedField)?.name ??
                  "Inbox",
              })}
              placeholder={t("composer.placeholder")}
              submitLabel={t("composer.send")}
              tags={tags}
              tools={composerTools}
              variant="floating"
              onDraftChange={setDraft}
            />
          </div>
        </form>
        {pendingDeleteField ? (
          <FieldDeleteDialog
            error={undefined}
            field={pendingDeleteField}
            isDeleting={false}
            t={t}
            onCancel={handleFieldDeleteCancel}
            onConfirm={() => void handleFieldDeleteConfirm()}
          />
        ) : null}
        {pendingDeleteTag ? (
          <TagDeleteDialog
            tag={pendingDeleteTag}
            t={t}
            onCancel={handleTagDeleteCancel}
            onConfirm={handleTagDeleteConfirm}
          />
        ) : null}
      </div>
    </main>
    </SourceHomeControlsProvider>
  );
}

/** Renders the in-app confirmation dialog for deleting an empty tag subtree. */
function TagDeleteDialog({
  tag,
  onCancel,
  onConfirm,
  t,
}: {
  tag: TagDto;
  onCancel: () => void;
  onConfirm: () => void;
  t: (key: string, options?: Record<string, string>) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] px-4">
      <section
        aria-labelledby="tag-delete-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--color-shadow-float)]"
        role="dialog"
      >
        <h2
          className="text-base font-semibold text-[var(--color-text-primary)]"
          id="tag-delete-title"
        >
          {t("tag.delete.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          {t("tag.delete.description", { tag: tag.path })}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="h-9 rounded-[10px] px-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
            type="button"
            onClick={onCancel}
          >
            {t("tag.delete.cancel")}
          </button>
          <button
            className="h-9 rounded-[10px] bg-[var(--color-error)] px-3 text-sm font-semibold text-[var(--color-error-contrast)] hover:opacity-90"
            type="button"
            onClick={onConfirm}
          >
            {t("tag.delete.confirm")}
          </button>
        </div>
      </section>
    </div>
  );
}

/** Renders the in-app confirmation dialog for deleting an unused field. */
function FieldDeleteDialog({
  error,
  field,
  isDeleting,
  onCancel,
  onConfirm,
  t,
}: {
  error?: string;
  field: FieldDto;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  t: (key: string, options?: Record<string, string>) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] px-4">
      <section
        aria-modal="true"
        className="w-full max-w-sm rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--color-shadow-float)]"
        role="dialog"
        aria-labelledby="field-delete-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              className="text-base font-semibold text-[var(--color-text-primary)]"
              id="field-delete-title"
            >
              {t("field.delete.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              {t("field.delete.description", { field: field.name })}
            </p>
          </div>
        </div>
        {error ? (
          <div className="mt-4 rounded-[10px] border border-[var(--color-error-border)] bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">
            {error}
          </div>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="h-9 rounded-[10px] px-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDeleting}
            type="button"
            onClick={onCancel}
          >
            {t("field.delete.cancel")}
          </button>
          <button
            className="h-9 rounded-[10px] bg-[var(--color-error)] px-3 text-sm font-semibold text-[var(--color-error-contrast)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDeleting}
            type="button"
            onClick={onConfirm}
          >
            {isDeleting ? t("field.delete.deleting") : t("field.delete.confirm")}
          </button>
        </div>
      </section>
    </div>
  );
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

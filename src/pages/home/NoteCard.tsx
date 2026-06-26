import { Bot, Check, ChevronDown, MoreHorizontal, User } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { FieldDto, NoteDto } from "../../api/types";
import { NoteEditor } from "./NoteEditor";
import { NoteMarkdownContent } from "./NoteMarkdownContent";
import type { ComposerTool } from "./homeTypes";
import {
  formatNoteTimestamp,
  formatTagPathLabel,
  stripRenderedFieldMarker,
  stripRenderedTagMarkers,
} from "./homeUtils";

/** Renders one recent note in the home feed. */
export function NoteCard({
  canStartEditing,
  editDraft,
  editWarning,
  fields,
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
  onFieldChange,
  onLoadNotePreview,
  onMention,
  tools,
}: {
  canStartEditing: boolean;
  editDraft?: string;
  editWarning?: string;
  fields: FieldDto[];
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
  onFieldChange: (note: NoteDto, fieldName: string) => Promise<void>;
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
  onMention: (noteId: string) => void;
  tools: ComposerTool[];
}) {
  const { t } = useTranslation("home");
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isFieldMenuOpen, setIsFieldMenuOpen] = useState(false);
  const [isFieldUpdating, setIsFieldUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const displayRole = note.role || t("sidebar.unknownRole");
  const displayContent = useMemo(
    () =>
      stripRenderedFieldMarker(
        stripRenderedTagMarkers(note.content, note.tags),
        fieldName,
      ),
    [fieldName, note.content, note.tags],
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const measureOverflow = useCallback(() => {
    const element = contentRef.current;

    if (!element) {
      return;
    }

    setHasOverflow(element.scrollHeight > element.clientHeight + 1);
  }, []);

  useLayoutEffect(() => {
    measureOverflow();
  }, [displayContent, fieldName, measureOverflow, note.tags]);

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

  /** Inserts this note as a valid mention into the active note draft. */
  function handleMentionClick() {
    onMention(note.id);
    setIsActionsOpen(false);
  }

  /** Enters edit mode when this card is allowed to own the draft. */
  function handleDoubleClick() {
    if (!isEditing && canStartEditing) {
      onEditStart(note);
    }
  }

  /** Changes this note to the selected field and closes the metadata menu. */
  async function handleFieldSelect(nextFieldName: string) {
    if (nextFieldName === fieldName || isFieldUpdating) {
      setIsFieldMenuOpen(false);
      return;
    }

    setIsFieldUpdating(true);
    try {
      await onFieldChange(note, nextFieldName);
      setIsFieldMenuOpen(false);
    } finally {
      setIsFieldUpdating(false);
    }
  }

  return (
    <article
      className="relative rounded-[18px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-3"
      onDoubleClick={handleDoubleClick}
    >
      <div className="mb-[3px] flex items-start justify-between gap-3 text-[13px] text-[var(--color-text-muted)]">
        <div className="min-w-0">
          {formatNoteTimestamp(note.updatedAt, locale)}
          {fieldName ? (
            <span className="relative ml-1 inline-flex">
              <button
                aria-expanded={isFieldMenuOpen}
                aria-label={t("note.fieldMenu.switch", { field: fieldName })}
                className="inline-flex items-center gap-0.5 rounded-[6px] font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isEditing || fields.length === 0 || isFieldUpdating}
                onClick={() => setIsFieldMenuOpen((current) => !current)}
                type="button"
              >
                @{fieldName}
                <ChevronDown className="size-3" aria-hidden="true" />
              </button>
              {isFieldMenuOpen ? (
                <div
                  className="absolute left-0 top-6 z-40 min-w-36 overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[var(--color-shadow-float)]"
                  role="menu"
                >
                  {fields.map((field) => {
                    const selected = field.name === fieldName;

                    return (
                      <button
                        aria-checked={selected}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isFieldUpdating}
                        key={field.id}
                        onClick={() => void handleFieldSelect(field.name)}
                        role="menuitemradio"
                        type="button"
                      >
                        <span>@{field.name}</span>
                        {selected ? (
                          <Check className="size-4 text-[var(--color-accent)]" aria-hidden="true" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-start gap-1.5">
          <span
            aria-label={t("note.roleLabel", { role: displayRole })}
            className="inline-flex size-7 items-center justify-center text-[var(--color-accent)]"
            title={displayRole}
          >
            {note.role === "Human" ? (
              <User className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Bot className="size-4 shrink-0" aria-hidden="true" />
            )}
          </span>
          {!isEditing ? (
            <div className="relative -mr-2 -mt-1 shrink-0">
            <button
              aria-expanded={isActionsOpen}
              aria-label={t("note.actions")}
              className="flex size-8 items-center justify-center rounded-[9px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
              onClick={() => setIsActionsOpen((current) => !current)}
              type="button"
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
            </button>
            {isActionsOpen ? (
              <div className="absolute right-0 top-9 z-30 min-w-28 overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--color-shadow-float)]">
                <button
                  className="block w-full px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
                  onClick={handleMentionClick}
                  type="button"
                >
                  {t("note.mention")}
                </button>
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
        </div>
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
          <div
            className="overflow-hidden text-base leading-7 text-[var(--color-text-primary)]"
            ref={contentRef}
            style={expanded ? undefined : { maxHeight: "5.25rem" }}
          >
            {note.tags.length > 0 ? (
              <div className="mb-1 flex flex-wrap gap-1.5">
                {note.tags.map((tag) => (
                  <span
                    className="inline-flex h-[25px] items-center rounded-[7px] bg-[var(--color-accent-soft)] px-2 text-[13px] font-semibold text-[var(--color-accent)]"
                    key={tag}
                  >
                    #{formatTagPathLabel(tag)}
                  </span>
                ))}
              </div>
            ) : null}
            <NoteMarkdownContent
              content={displayContent}
              onLoadNotePreview={onLoadNotePreview}
            />
          </div>
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

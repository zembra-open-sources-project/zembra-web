import { MoreHorizontal } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { NoteDto } from "../../api/types";
import { NoteEditor } from "./NoteEditor";
import type { ComposerTool } from "./homeTypes";
import { formatNoteTimestamp, stripRenderedTagMarkers } from "./homeUtils";

/** Renders one recent note in the home feed. */
export function NoteCard({
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
  onLoadNotePreview,
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
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
  tools: ComposerTool[];
}) {
  const { t } = useTranslation("home");
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const displayContent = useMemo(
    () => stripRenderedTagMarkers(note.content, note.tags),
    [note.content, note.tags],
  );
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

  /** Enters edit mode when this card is allowed to own the draft. */
  function handleDoubleClick() {
    if (!isEditing && canStartEditing) {
      onEditStart(note);
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
            <span className="ml-1 font-bold text-[var(--color-text-secondary)]">@{fieldName}</span>
          ) : null}
        </div>
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
            className="overflow-hidden whitespace-pre-wrap text-base leading-7 text-[var(--color-text-primary)]"
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
            {displayContent}
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

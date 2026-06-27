import { SendHorizontal } from "lucide-react";
import { KeyboardEvent, MouseEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TagDto } from "../../api/types";
import {
  LiveMarkdownEditor,
  type LiveMarkdownEditorHandle,
} from "./LiveMarkdownEditor";
import type { ComposerTool } from "./homeTypes";

/** Renders a reusable note text editor shared by creation and card editing. */
export function NoteEditor({
  draft,
  isSubmitting,
  meta,
  onCancel,
  onDraftChange,
  placeholder,
  submitLabel,
  tags,
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
  tags: TagDto[];
  tools: ComposerTool[];
  variant: "floating" | "embedded";
  warning?: string;
}) {
  const { t } = useTranslation("home");
  const editorRef = useRef<LiveMarkdownEditorHandle>(null);

  /** Handles keyboard shortcuts scoped to this editor. */
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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
    editorRef.current?.applyTool(tool);
  }

  return (
    <div
      className={[
        "overflow-hidden rounded-[18px] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)]",
        variant === "floating"
          ? "shadow-[var(--color-shadow-float)] backdrop-blur"
          : "shadow-[inset_0_0_0_1px_var(--color-border-subtle)]",
      ].join(" ")}
      onKeyDown={handleKeyDown}
    >
      <LiveMarkdownEditor
        disabled={isSubmitting}
        placeholder={placeholder}
        value={draft}
        tags={tags}
        variant={variant}
        ref={editorRef}
        onChange={onDraftChange}
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

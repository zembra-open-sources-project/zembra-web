import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  forwardRef,
  type FormEvent,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { TagDto } from "../../api/types";
import {
  findActiveTagQuery,
  getTagSuggestions,
  normalizeEditorMarkdown,
  type TagSuggestion,
} from "./liveMarkdownEditorUtils";

export interface LiveMarkdownEditorHandle {
  /** Inserts plain Markdown text at the current editor selection. */
  insertMarkdown: (before: string, after?: string) => void;
}

/** Renders a Tiptap-backed Markdown editor with inline tag chips. */
export const LiveMarkdownEditor = forwardRef<
  LiveMarkdownEditorHandle,
  {
    disabled?: boolean;
    placeholder: string;
    tags: TagDto[];
    value: string;
    variant: "floating" | "embedded";
    onChange: (value: string) => void;
  }
>(function LiveMarkdownEditor(
  { disabled = false, placeholder, tags, value, variant, onChange },
  ref,
) {
  const { t } = useTranslation("home");
  const [tagMenu, setTagMenu] = useState<
    | {
        left: number;
        options: TagSuggestion[];
        range: { from: number; to: number };
        top: number;
      }
    | undefined
  >();

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: {},
        hardBreak: {},
        link: false,
        trailingNode: false,
      }),
      Link.configure({
        autolink: true,
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Typography,
      Mention.configure({
        HTMLAttributes: {
          class: "editor-tag-chip",
        },
        renderText({ node }) {
          return `#${node.attrs.label ?? node.attrs.id}`;
        },
        suggestion: {
          char: "#",
          items: () => [],
        },
      }),
      Markdown.configure({
        markedOptions: {
          breaks: true,
          gfm: true,
        },
      }),
      tagChipDecorationExtension(),
    ],
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    content: value,
    contentType: "markdown",
    editable: !disabled,
    editorProps: {
      attributes: {
        "aria-label": placeholder,
        class: [
          "live-markdown-editor-content",
          variant === "floating"
            ? "live-markdown-editor-content-floating"
            : "live-markdown-editor-content-embedded",
        ].join(" "),
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    extensions,
    onUpdate({ editor: currentEditor }) {
      onChange(normalizeEditorMarkdown(currentEditor.getMarkdown()));
      updateTagMenu(currentEditor);
    },
    onSelectionUpdate({ editor: currentEditor }) {
      updateTagMenu(currentEditor);
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = normalizeEditorMarkdown(editor.getMarkdown());

    if (current !== value) {
      editor.commands.setContent(value, {
        contentType: "markdown",
        emitUpdate: false,
      });
    }

    editor.view.dom.setAttribute("data-markdown-value", value);
  }, [editor, value]);

  useImperativeHandle(
    ref,
    () => ({
      insertMarkdown(before: string, after = "") {
        editor?.chain().focus().insertContent(`${before}${after}`).run();
      },
    }),
    [editor],
  );

  /** Inserts a chosen tag path at the active hash token range. */
  function handleTagSelect(option: TagSuggestion) {
    if (!editor || !tagMenu) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContentAt(tagMenu.range, `#${option.path} `)
      .run();
    setTagMenu(undefined);
  }

  /** Updates the suggestion popup from the active editor selection. */
  function updateTagMenu(currentEditor = editor) {
    if (!currentEditor) {
      setTagMenu(undefined);
      return;
    }

    const { from } = currentEditor.state.selection;
    const parentOffset = currentEditor.state.selection.$from.parentOffset;
    const textBeforeCursor =
      currentEditor.state.selection.$from.parent.textBetween(0, parentOffset);
    const activeQuery = findActiveTagQuery(textBeforeCursor);

    if (!activeQuery) {
      setTagMenu(undefined);
      return;
    }

    const options = getTagSuggestions(activeQuery.query, tags);

    if (options.length === 0) {
      setTagMenu(undefined);
      return;
    }

    const tagStart = from - activeQuery.query.length - 1;
    const rect = currentEditor.view.coordsAtPos(from);

    setTagMenu({
      left: Math.min(rect.left, window.innerWidth - 260),
      options,
      range: { from: tagStart, to: from },
      top: rect.bottom + 6,
    });
  }

  /** Synchronizes synthetic contenteditable input used by DOM-based tests. */
  function handleEditorInput(event: FormEvent<HTMLDivElement>) {
    if (!editor || event.nativeEvent.isTrusted) {
      return;
    }

    const textContent = event.currentTarget.textContent ?? "";
    editor.commands.setContent(textContent, {
      contentType: "markdown",
      emitUpdate: false,
    });
    editor.view.dom.setAttribute("data-markdown-value", textContent);
    onChange(normalizeEditorMarkdown(textContent));
    updateTagMenu(editor);
  }

  return (
    <div className="relative">
      <EditorContent editor={editor} onInput={handleEditorInput} />
      {tagMenu ? (
        <div
          className="fixed z-50 max-h-56 w-64 overflow-y-auto rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-1 shadow-[var(--color-shadow-float)]"
          role="listbox"
          style={{
            left: `${Math.max(8, tagMenu.left)}px`,
            top: `${tagMenu.top}px`,
          }}
        >
          {tagMenu.options.map((option) => (
            <button
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
              key={`${option.type}-${option.path}`}
              role="option"
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                handleTagSelect(option);
              }}
            >
              <span>
                {option.type === "create"
                  ? t("composer.tagSuggestion.create", { tag: option.path })
                  : option.label}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
});

/** Adds visual chip decoration to hash tags while keeping plain Markdown text editable. */
function tagChipDecorationExtension() {
  return Extension.create({
    name: "tagChipDecoration",

    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            decorations(state) {
              const decorations: Decoration[] = [];

              state.doc.descendants((node, position) => {
                if (!node.isText || !node.text) {
                  return;
                }

                for (const match of node.text.matchAll(/(?:^|\s)#([^\s#@]+)/g)) {
                  const fullMatch = match[0];
                  const leadingLength = fullMatch.startsWith("#") ? 0 : 1;
                  const from = position + (match.index ?? 0) + leadingLength;
                  const to = from + fullMatch.length - leadingLength;

                  decorations.push(
                    Decoration.inline(from, to, {
                      class: "editor-tag-chip",
                    }),
                  );
                }
              });

              return DecorationSet.create(state.doc, decorations);
            },
          },
        }),
      ];
    },
  });
}

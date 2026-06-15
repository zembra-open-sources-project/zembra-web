import type { Components } from "react-markdown";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import { useTranslation } from "react-i18next";
import remarkGfm from "remark-gfm";
import { useRef, useState, type ReactNode } from "react";
import type { NoteDto } from "../../api/types";
import {
  formatShortNoteRef,
  parseRenderableNoteContent,
} from "./homeUtils";

const noteLinkUrlPrefix = "zembra-note://";

interface MarkdownTextNode {
  type: "text";
  value: string;
}

interface MarkdownLinkNode {
  type: "link";
  url: string;
  title: null;
  children: MarkdownTextNode[];
}

interface MarkdownParentNode {
  children?: MarkdownNode[];
}

type MarkdownNode = MarkdownTextNode | MarkdownLinkNode | MarkdownParentNode;

/** Renders a note body with GFM Markdown and Zembra note-link previews. */
export function NoteMarkdownContent({
  content,
  onLoadNotePreview,
}: {
  content: string;
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
}) {
  const components = createMarkdownComponents(onLoadNotePreview);

  return (
    <div className="note-markdown">
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm, remarkNoteLinks]}
        urlTransform={(url) =>
          url.startsWith(noteLinkUrlPrefix)
            ? url
            : defaultUrlTransform(url)
        }
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** Converts Zembra note references in Markdown text nodes into internal links. */
function remarkNoteLinks() {
  return (tree: MarkdownNode) => {
    transformNoteLinks(tree);
  };
}

/** Walks Markdown nodes and rewrites text-node note references in place. */
function transformNoteLinks(node: MarkdownNode): void {
  if (!("children" in node) || !Array.isArray(node.children)) {
    return;
  }

  node.children = node.children.flatMap((child) => {
    if ("type" in child && child.type === "text") {
      return createNoteLinkNodes(child.value);
    }

    if ("type" in child && child.type === "link") {
      return [child];
    }

    transformNoteLinks(child);
    return [child];
  });
}

/** Splits one text node into plain text and internal note-link nodes. */
function createNoteLinkNodes(value: string): MarkdownNode[] {
  return parseRenderableNoteContent(value).map((segment) => {
    if (segment.type === "text") {
      return {
        type: "text",
        value: segment.text,
      };
    }

    return {
      type: "link",
      url: `${noteLinkUrlPrefix}${segment.targetNoteRef}`,
      title: null,
      children: [
        {
          type: "text",
          value: segment.anchorText,
        },
      ],
    };
  });
}

/** Creates Markdown element renderers bound to the note preview loader. */
function createMarkdownComponents(
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>,
): Components {
  return {
    a({ children, href }) {
      if (href?.startsWith(noteLinkUrlPrefix)) {
        return (
          <NoteLinkPreview
            noteRef={href.slice(noteLinkUrlPrefix.length)}
            onLoadNotePreview={onLoadNotePreview}
          />
        );
      }

      return (
        <a
          className="font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
          href={href}
          rel="noreferrer"
          target="_blank"
        >
          {children}
        </a>
      );
    },
    code({ children, className }) {
      const isBlock = className?.startsWith("language-");

      if (isBlock) {
        return <code className={className}>{children}</code>;
      }

      return (
        <code className="rounded-[5px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1 py-0.5 text-[0.92em] text-[var(--color-text-primary)]">
          {children}
        </code>
      );
    },
    input(props) {
      return <input {...props} readOnly />;
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto">
          <table>{children}</table>
        </div>
      );
    },
  };
}

/** Renders one compact note reference with hover preview content. */
function NoteLinkPreview({
  noteRef,
  onLoadNotePreview,
}: {
  noteRef: string;
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
}) {
  const { t } = useTranslation("home");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<NoteDto>();
  const [hasError, setHasError] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ left: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  /** Loads preview content when the user inspects this note reference. */
  async function handlePreviewOpen() {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (rect) {
      setPreviewPosition({
        left: Math.min(rect.left, window.innerWidth - 304),
        top: rect.bottom + 6,
      });
    }

    setIsOpen(true);

    if (preview || isLoading) {
      return;
    }

    setIsLoading(true);
    setHasError(false);
    try {
      setPreview(await onLoadNotePreview(noteRef));
    } catch (error) {
      console.error("Failed to load note link preview", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  /** Hides the hover preview without clearing cached content. */
  function handlePreviewClose() {
    setIsOpen(false);
  }

  return (
    <span className="relative inline-flex">
      <button
        aria-label={t("note.linkPreview.label", {
          id: formatShortNoteRef(noteRef),
        })}
        className="mx-0.5 inline-flex h-[24px] items-center rounded-[7px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 text-[13px] font-semibold text-[var(--color-accent)] hover:border-[var(--color-accent)]"
        onBlur={handlePreviewClose}
        onFocus={() => void handlePreviewOpen()}
        onMouseEnter={() => void handlePreviewOpen()}
        onMouseLeave={handlePreviewClose}
        ref={buttonRef}
        type="button"
      >
        {formatShortNoteRef(noteRef)}
      </button>
      {isOpen ? (
        <span
          className="fixed z-40 block w-72 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-left text-sm leading-6 text-[var(--color-text-primary)] shadow-[var(--color-shadow-float)]"
          style={{
            left: `${Math.max(8, previewPosition.left)}px`,
            top: `${previewPosition.top}px`,
          }}
        >
          {renderPreviewContent({
            hasError,
            isLoading,
            loadingLabel: t("note.linkPreview.loading"),
            previewContent: preview?.content,
            unavailableLabel: t("note.linkPreview.unavailable"),
          })}
        </span>
      ) : null}
    </span>
  );
}

/** Returns the visible text for the note-link preview bubble. */
function renderPreviewContent({
  hasError,
  isLoading,
  loadingLabel,
  previewContent,
  unavailableLabel,
}: {
  hasError: boolean;
  isLoading: boolean;
  loadingLabel: string;
  previewContent?: string;
  unavailableLabel: string;
}): ReactNode {
  if (isLoading) {
    return loadingLabel;
  }

  if (hasError) {
    return unavailableLabel;
  }

  return previewContent ?? unavailableLabel;
}

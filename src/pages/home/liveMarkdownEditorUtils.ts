import type { TagDto } from "../../api/types";

export interface TagSuggestion {
  /** Text shown in the suggestion menu. */
  label: string;
  /** Full tag path inserted into the editor content without the leading hash. */
  path: string;
  /** Whether this item represents a new tag path not present in taxonomy. */
  type: "existing" | "create";
}

/** Returns tag suggestions for the current hash query. */
export function getTagSuggestions(
  query: string,
  tags: TagDto[],
): TagSuggestion[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [];
  }

  const existing = tags
    .filter((tag) => tagMatchesQuery(tag, normalizedQuery))
    .map((tag) => ({
      label: `#${tag.path}`,
      path: tag.path,
      type: "existing" as const,
    }));

  if (existing.length > 0) {
    return existing;
  }

  return [
    {
      label: `#${query}`,
      path: query,
      type: "create",
    },
  ];
}

/** Converts editor Markdown output into the note content format expected by parsers. */
export function normalizeEditorMarkdown(markdown: string): string {
  return markdown
    .replace(/\\#([^\s#@]+)/g, "#$1")
    .replace(/\u00a0/g, " ");
}

/** Finds a hash tag query immediately before the cursor in plain editor text. */
export function findActiveTagQuery(textBeforeCursor: string):
  | { fromOffset: number; query: string }
  | undefined {
  const match = /(?:^|\s)#([^\s#@]*)$/.exec(textBeforeCursor);

  if (!match || match[1].length === 0) {
    return undefined;
  }

  return {
    fromOffset: match.index + match[0].lastIndexOf("#"),
    query: match[1],
  };
}

/** Returns whether one taxonomy tag should appear for the current suggestion query. */
function tagMatchesQuery(tag: TagDto, query: string): boolean {
  return (
    tag.path.toLowerCase().includes(query) ||
    tag.name.toLowerCase().includes(query)
  );
}

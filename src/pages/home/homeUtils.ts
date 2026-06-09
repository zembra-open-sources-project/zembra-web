import type { NoteDto, TagDto } from "../../api/types";
import type { NoteLinkInput } from "../../api/types";

export type RenderableNoteContentSegment =
  | { text: string; type: "text" }
  | { anchorText: string; targetNoteRef: string; type: "link" };

export interface TagTreeNode {
  /** Tag represented by this tree node. */
  tag: TagDto;
  /** Direct second-level children of this root tag. */
  children: TagDto[];
}

export interface TagFilterMatch {
  /** Full tag paths that should match the selected sidebar tag. */
  paths: string[];
  /** Legacy or display names that should match the selected sidebar tag. */
  names: string[];
}

const fullNoteLinkPattern = /\[\[([A-Fa-f0-9]{32})\]\]/g;

/** Applies current home feed filters to recent notes. */
export function filterVisibleNotes(
  notes: NoteDto[],
  query: { fieldId?: string; keyword: string; tag?: string; tagMatch?: TagFilterMatch },
): NoteDto[] {
  const keyword = query.keyword.trim();

  return notes.filter((note) => {
    const keywordMatched = !keyword || note.content.includes(keyword);
    const tagMatched = noteMatchesTagPath(note.tags, query.tag, query.tagMatch);
    const fieldMatched = !query.fieldId || note.fieldId === query.fieldId;
    return keywordMatched && tagMatched && fieldMatched;
  });
}

/** Counts tag usage in recent notes for the sidebar tag navigation. */
export function countTags(notes: NoteDto[]): Map<string, number> {
  const counts = new Map<string, number>();

  notes.forEach((note) => {
    note.tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return counts;
}

/** Counts note usage by field ID for the sidebar field navigation. */
export function countFields(notes: NoteDto[]): Map<string, number> {
  const counts = new Map<string, number>();

  notes.forEach((note) => {
    if (!note.fieldId) {
      return;
    }

    counts.set(note.fieldId, (counts.get(note.fieldId) ?? 0) + 1);
  });

  return counts;
}

/** Counts note usage by creator role for the sidebar role navigation. */
export function countRoles(notes: NoteDto[]): Map<string, number> {
  const counts = new Map<string, number>();

  notes.forEach((note) => {
    counts.set(note.role, (counts.get(note.role) ?? 0) + 1);
  });

  return counts;
}

/** Extracts inline tag names from composer content. */
export function parseTagNames(content: string): string[] {
  return Array.from(
    content.matchAll(/(?:^|\s)#([^\s#@]+)/g),
    (match) => match[1],
  );
}

/** Splits a full tag path into non-empty hierarchy segments. */
export function splitTagPath(path: string): string[] {
  return path
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

/** Formats a tag path for compact text-only display. */
export function formatTagPathLabel(path: string): string {
  return splitTagPath(path).join("/");
}

/** Returns whether a note tag collection matches the selected tag path. */
export function noteMatchesTagPath(
  noteTags: string[],
  selectedTag?: string,
  match?: TagFilterMatch,
): boolean {
  if (!selectedTag) {
    return true;
  }

  const pathMatches = match?.paths ?? [selectedTag];
  const nameMatches = match?.names ?? [];

  return noteTags.some((tag) =>
    pathMatches.some((path) => tag === path || tag.startsWith(`${path}/`)) ||
    nameMatches.includes(tag)
  );
}

/** Builds a stable two-level tag tree for the home sidebar. */
export function buildTagTree(tags: TagDto[]): TagTreeNode[] {
  const rootsByPath = new Map<string, TagTreeNode>();
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));

  tags.forEach((tag) => {
    if (tag.depth === 0 || !tag.parentTagId) {
      ensureRootNode(rootsByPath, tag);
    }
  });

  tags.forEach((tag) => {
    if (tag.depth !== 1 || !tag.parentTagId) {
      return;
    }

    const parent = tagsById.get(tag.parentTagId);
    const root = parent ?? createRootFromChildPath(tag);
    const rootNode = ensureRootNode(rootsByPath, root);

    if (!rootNode.children.some((child) => child.path === tag.path)) {
      rootNode.children.push(tag);
    }
  });

  return Array.from(rootsByPath.values()).map((node) => ({
    ...node,
    children: [...node.children].sort(compareTagsByPath),
  })).sort((left, right) => compareTagsByPath(left.tag, right.tag));
}

/** Finds the root path that owns a selected tag path. */
export function findSelectedTagRootPath(
  tree: TagTreeNode[],
  selectedTag?: string,
): string | undefined {
  if (!selectedTag) {
    return undefined;
  }

  return tree.find((node) => (
    node.tag.path === selectedTag ||
    node.children.some((child) => child.path === selectedTag)
  ))?.tag.path;
}

/** Builds matching aliases for selected tree tags, including legacy leaf names. */
export function buildTagFilterMatch(
  tree: TagTreeNode[],
  selectedTag?: string,
): TagFilterMatch | undefined {
  if (!selectedTag) {
    return undefined;
  }

  for (const node of tree) {
    if (node.tag.path === selectedTag) {
      return {
        paths: [node.tag.path, ...node.children.map((child) => child.path)],
        names: [node.tag.name, ...node.children.map((child) => child.name)],
      };
    }

    const child = node.children.find((item) => item.path === selectedTag);

    if (child) {
      return {
        paths: [child.path],
        names: [child.name],
      };
    }
  }

  return { paths: [selectedTag], names: [] };
}

/** Removes tag markers that are already rendered as note chips. */
export function stripRenderedTagMarkers(content: string, tags: string[]): string {
  if (tags.length === 0) {
    return content;
  }

  const tagSet = new Set(tags);

  return content
    .replace(/(^|\s)#([^\s#@]+)/g, (match, leading: string, tag: string) => {
      if (!tagSet.has(tag)) {
        return match;
      }

      return leading;
    })
    .trimStart();
}

/** Removes a field marker that is already rendered as note metadata. */
export function stripRenderedFieldMarker(
  content: string,
  fieldName?: string,
): string {
  if (!fieldName) {
    return content;
  }

  return content
    .replace(/(^|\s)@([^\s#@]+)/g, (match, leading: string, field: string) => {
      if (field !== fieldName) {
        return match;
      }

      return leading;
    })
    .trimStart();
}

/** Ensures a root node exists for a tag path and returns it. */
function ensureRootNode(
  rootsByPath: Map<string, TagTreeNode>,
  tag: TagDto,
): TagTreeNode {
  const existing = rootsByPath.get(tag.path);

  if (existing) {
    return existing;
  }

  const node = { tag, children: [] };
  rootsByPath.set(tag.path, node);
  return node;
}

/** Creates a synthetic root tag for child records whose parent is missing. */
function createRootFromChildPath(tag: TagDto): TagDto {
  const [rootName = tag.name] = splitTagPath(tag.path);
  return {
    id: `orphan-root:${rootName}`,
    name: rootName,
    path: rootName,
    depth: 0,
    createdAt: tag.createdAt,
  };
}

/** Sorts tag DTOs by path for stable sidebar rendering. */
function compareTagsByPath(left: TagDto, right: TagDto): number {
  return left.path.localeCompare(right.path);
}

/** Extracts inline field names from note content in document order. */
export function parseFieldNames(content: string): string[] {
  return Array.from(
    content.matchAll(/(?:^|\s)@([^\s#@]+)/g),
    (match) => match[1],
  );
}

/** Extracts full UUID note links from note content for backend submission. */
export function parseNoteLinks(content: string): NoteLinkInput[] {
  return Array.from(content.matchAll(fullNoteLinkPattern), (match) => ({
    anchorText: match[0],
    position: match.index ?? null,
    targetNoteRef: match[1],
  }));
}

/** Formats a full note reference as the compact card display label. */
export function formatShortNoteRef(noteRef: string): string {
  return noteRef.slice(0, 6);
}

/** Splits note content into plain text and note-link display segments. */
export function parseRenderableNoteContent(
  content: string,
): RenderableNoteContentSegment[] {
  const segments: RenderableNoteContentSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(fullNoteLinkPattern)) {
    const start = match.index ?? 0;

    if (start > lastIndex) {
      segments.push({ text: content.slice(lastIndex, start), type: "text" });
    }

    segments.push({
      anchorText: match[0],
      targetNoteRef: match[1],
      type: "link",
    });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ text: content.slice(lastIndex), type: "text" });
  }

  return segments.length > 0 ? segments : [{ text: content, type: "text" }];
}

/** Formats a Unix timestamp for note card metadata. */
export function formatNoteTimestamp(timestamp: number, locale = "zh-CN"): string {
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
export function getHeatmapLevel(count: number, maxCount: number): number {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }

  return Math.min(4, Math.max(1, Math.ceil((count / maxCount) * 4)));
}

/** Formats a YYYY-MM-DD heatmap date for compact sidebar labels. */
export function formatHeatmapDate(dateKey: string | undefined, locale = "zh-CN"): string {
  if (!dateKey) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${dateKey}T00:00:00`));
}

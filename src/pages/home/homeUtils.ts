import type { NoteDto } from "../../api/types";

/** Applies current home feed filters to recent notes. */
export function filterVisibleNotes(
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

/** Extracts inline tag names from composer content. */
export function parseTagNames(content: string): string[] {
  return Array.from(
    content.matchAll(/(?:^|\s)#([^\s#@]+)/g),
    (match) => match[1],
  );
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

/** Extracts inline field names from note content in document order. */
export function parseFieldNames(content: string): string[] {
  return Array.from(
    content.matchAll(/(?:^|\s)@([^\s#@]+)/g),
    (match) => match[1],
  );
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

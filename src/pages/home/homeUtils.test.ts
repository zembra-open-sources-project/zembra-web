import { describe, expect, test } from "vitest";
import {
  buildTagTree,
  countRoles,
  findSelectedTagRootPath,
  formatTagPathLabel,
  formatShortNoteRef,
  noteMatchesTagPath,
  parseNoteLinks,
  parseRenderableNoteContent,
  parseTagNames,
  stripRenderedFieldMarker,
  stripRenderedTagMarkers,
} from "./homeUtils";

const firstNoteId = "abcdef1234567890abcdef1234567890";
const secondNoteId = "1234567890abcdef1234567890abcdef";

describe("note link parsing", () => {
  test("extracts full UUID note links with anchor text and position", () => {
    expect(parseNoteLinks(`see [[${firstNoteId}]] now`)).toEqual([
      {
        anchorText: `[[${firstNoteId}]]`,
        position: 4,
        targetNoteRef: firstNoteId,
      },
    ]);
  });

  test("keeps duplicate note links as separate backend links", () => {
    expect(parseNoteLinks(`[[${firstNoteId}]] and [[${firstNoteId}]]`)).toEqual([
      {
        anchorText: `[[${firstNoteId}]]`,
        position: 0,
        targetNoteRef: firstNoteId,
      },
      {
        anchorText: `[[${firstNoteId}]]`,
        position: 41,
        targetNoteRef: firstNoteId,
      },
    ]);
  });

  test("ignores short or non-hex note link candidates", () => {
    expect(parseNoteLinks("[[abc123]] [[not-a-note-id]]")).toEqual([]);
  });

  test("formats note references as six-character labels", () => {
    expect(formatShortNoteRef(firstNoteId)).toBe("abcdef");
  });

  test("splits renderable note content into text and link segments", () => {
    expect(
      parseRenderableNoteContent(
        `A [[${firstNoteId}]] B [[${secondNoteId}]]`,
      ),
    ).toEqual([
      { text: "A ", type: "text" },
      {
        anchorText: `[[${firstNoteId}]]`,
        targetNoteRef: firstNoteId,
        type: "link",
      },
      { text: " B ", type: "text" },
      {
        anchorText: `[[${secondNoteId}]]`,
        targetNoteRef: secondNoteId,
        type: "link",
      },
    ]);
  });
});

describe("hierarchical tag helpers", () => {
  test("extracts two-level tag paths from inline content", () => {
    expect(parseTagNames("read #books/hands-on-gpt next #inbox")).toEqual([
      "books/hands-on-gpt",
      "inbox",
    ]);
  });

  test("formats tag paths with a readable separator", () => {
    expect(formatTagPathLabel("books/hands-on-gpt")).toBe(
      "books/hands-on-gpt",
    );
  });

  test("removes rendered two-level tag markers from note content", () => {
    expect(
      stripRenderedTagMarkers("#books/hands-on-gpt useful note", [
        "books/hands-on-gpt",
      ]),
    ).toBe("useful note");
  });

  test("removes rendered field markers from note content", () => {
    expect(stripRenderedFieldMarker("@alpha useful note", "alpha")).toBe(
      "useful note",
    );
  });

  test("keeps non-rendered field markers in note content", () => {
    expect(stripRenderedFieldMarker("@beta useful note", "alpha")).toBe(
      "@beta useful note",
    );
  });

  test("matches parent tag paths as a subtree and child paths exactly", () => {
    expect(noteMatchesTagPath(["books/hands-on-gpt"], "books")).toBe(true);
    expect(noteMatchesTagPath(["books/hands-on-gpt"], "books/hands-on-gpt"))
      .toBe(true);
    expect(noteMatchesTagPath(["books/other"], "books/hands-on-gpt")).toBe(
      false,
    );
    expect(noteMatchesTagPath(["notebooks"], "books")).toBe(false);
  });

  test("builds a stable two-level tag tree", () => {
    expect(
      buildTagTree([
        {
          id: "tag-books-gpt",
          name: "hands-on-gpt",
          parentTagId: "tag-books",
          path: "books/hands-on-gpt",
          depth: 1,
          createdAt: 2,
        },
        {
          id: "tag-books",
          name: "books",
          path: "books",
          depth: 0,
          createdAt: 1,
        },
      ]),
    ).toEqual([
      {
        tag: {
          id: "tag-books",
          name: "books",
          path: "books",
          depth: 0,
          createdAt: 1,
        },
        children: [
          {
            id: "tag-books-gpt",
            name: "hands-on-gpt",
            parentTagId: "tag-books",
            path: "books/hands-on-gpt",
            depth: 1,
            createdAt: 2,
          },
        ],
      },
    ]);
  });

  test("keeps orphan child tags under a synthetic root", () => {
    expect(
      buildTagTree([
        {
          id: "tag-orphan",
          name: "missing",
          parentTagId: "missing-parent",
          path: "projects/missing",
          depth: 1,
          createdAt: 3,
        },
      ]),
    ).toEqual([
      {
        tag: {
          id: "orphan-root:projects",
          name: "projects",
          path: "projects",
          depth: 0,
          createdAt: 3,
        },
        children: [
          {
            id: "tag-orphan",
            name: "missing",
            parentTagId: "missing-parent",
            path: "projects/missing",
            depth: 1,
            createdAt: 3,
          },
        ],
      },
    ]);
  });

  test("finds the root path for selected child tags", () => {
    const tree = buildTagTree([
      {
        id: "tag-books",
        name: "books",
        path: "books",
        depth: 0,
        createdAt: 1,
      },
      {
        id: "tag-books-gpt",
        name: "hands-on-gpt",
        parentTagId: "tag-books",
        path: "books/hands-on-gpt",
        depth: 1,
        createdAt: 2,
      },
    ]);

    expect(findSelectedTagRootPath(tree, "books/hands-on-gpt")).toBe("books");
    expect(findSelectedTagRootPath(tree, "books")).toBe("books");
    expect(findSelectedTagRootPath(tree)).toBeUndefined();
  });
});

describe("role counting", () => {
  test("counts note usage by creator role", () => {
    expect(
      countRoles([
        {
          id: "note-1",
          content: "human note",
          role: "Human",
          createdAt: 1,
          updatedAt: 1,
          tags: [],
        },
        {
          id: "note-2",
          content: "agent note",
          role: "Agent",
          createdAt: 1,
          updatedAt: 1,
          tags: [],
        },
        {
          id: "note-3",
          content: "another agent note",
          role: "Agent",
          createdAt: 1,
          updatedAt: 1,
          tags: [],
        },
        {
          id: "note-4",
          content: "unknown role note",
          role: "",
          createdAt: 1,
          updatedAt: 1,
          tags: [],
        },
      ]),
    ).toEqual(new Map([
      ["Human", 1],
      ["Agent", 2],
      ["", 1],
    ]));
  });
});

import { describe, expect, test } from "vitest";
import {
  countRoles,
  formatShortNoteRef,
  parseNoteLinks,
  parseRenderableNoteContent,
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

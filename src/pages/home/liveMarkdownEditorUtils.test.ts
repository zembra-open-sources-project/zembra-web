import { describe, expect, test } from "vitest";
import {
  findActiveTagQuery,
  getTagSuggestions,
  normalizeEditorMarkdown,
} from "./liveMarkdownEditorUtils";

const tags = [
  {
    id: "tag-books",
    name: "books",
    path: "books",
    depth: 0,
    createdAt: 1,
  },
  {
    id: "tag-gpt",
    name: "hands-on-gpt",
    path: "books/hands-on-gpt",
    parentTagId: "tag-books",
    depth: 1,
    createdAt: 2,
  },
];

describe("getTagSuggestions", () => {
  test("does not show suggestions for an empty hash query", () => {
    expect(getTagSuggestions("", tags)).toEqual([]);
  });

  test("matches existing tags by full path and leaf name", () => {
    expect(getTagSuggestions("books/han", tags)).toEqual([
      {
        label: "#books/hands-on-gpt",
        path: "books/hands-on-gpt",
        type: "existing",
      },
    ]);
    expect(getTagSuggestions("hands", tags)).toEqual([
      {
        label: "#books/hands-on-gpt",
        path: "books/hands-on-gpt",
        type: "existing",
      },
    ]);
  });

  test("returns a create suggestion when no tag matches", () => {
    expect(getTagSuggestions("new-tag", tags)).toEqual([
      {
        label: "#new-tag",
        path: "new-tag",
        type: "create",
      },
    ]);
  });
});

describe("findActiveTagQuery", () => {
  test("finds a non-empty tag query before the cursor", () => {
    expect(findActiveTagQuery("hello #hand")).toEqual({
      fromOffset: 6,
      query: "hand",
    });
  });

  test("ignores a bare hash", () => {
    expect(findActiveTagQuery("hello #")).toBeUndefined();
  });
});

describe("normalizeEditorMarkdown", () => {
  test("keeps hash tag markers parseable after markdown serialization", () => {
    expect(normalizeEditorMarkdown("\\#books/hands-on-gpt\nnext")).toBe(
      "#books/hands-on-gpt\nnext",
    );
  });
});

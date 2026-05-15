import { describe, expect, test } from "vitest";
import { resources } from "./resources";

/** Flattens nested translation resources into dot-separated key paths. */
function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    flattenKeys(nestedValue, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n resources", () => {
  test("keeps locale namespaces aligned with en-US fallback resources", () => {
    const fallbackKeys = flattenKeys(resources["en-US"]).sort();

    expect(flattenKeys(resources["zh-CN"]).sort()).toEqual(fallbackKeys);
    expect(flattenKeys(resources["zh-TW"]).sort()).toEqual(fallbackKeys);
  });

  test("keeps app and page components free of bare Chinese UI copy", () => {
    const sourceFiles = {
      ...import.meta.glob("../app/**/!(*.test).{ts,tsx}", {
        eager: true,
        import: "default",
        query: "?raw",
      }),
      ...import.meta.glob("../pages/**/!(*.test).{ts,tsx}", {
        eager: true,
        import: "default",
        query: "?raw",
      }),
    } as Record<string, string>;
    const filesWithBareChinese = Object.entries(sourceFiles)
      .filter(([, content]) => /[\u4e00-\u9fff]/.test(content))
      .map(([file]) => file);

    expect(filesWithBareChinese).toEqual([]);
  });
});

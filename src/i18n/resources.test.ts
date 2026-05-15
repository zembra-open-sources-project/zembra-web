import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
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

/** Lists TypeScript source files under a directory, excluding tests. */
function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return listSourceFiles(path);
    }

    return entry.isFile() &&
      /\.(ts|tsx)$/.test(entry.name) &&
      !entry.name.includes(".test.")
      ? [path]
      : [];
  });
}

describe("i18n resources", () => {
  test("keeps locale namespaces aligned with en-US fallback resources", () => {
    const fallbackKeys = flattenKeys(resources["en-US"]).sort();

    expect(flattenKeys(resources["zh-CN"]).sort()).toEqual(fallbackKeys);
    expect(flattenKeys(resources["zh-TW"]).sort()).toEqual(fallbackKeys);
  });

  test("keeps app and page components free of bare Chinese UI copy", () => {
    const sourceFiles = [
      ...listSourceFiles(join(process.cwd(), "src/app")),
      ...listSourceFiles(join(process.cwd(), "src/pages")),
    ];
    const filesWithBareChinese = sourceFiles.filter((file) =>
      /[\u4e00-\u9fff]/.test(readFileSync(file, "utf8")),
    );

    expect(filesWithBareChinese).toEqual([]);
  });
});

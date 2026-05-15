import { describe, expect, test } from "vitest";
import {
  getInitialLocale,
  normalizeLocale,
  persistLocale,
  readStoredLocale,
} from "./locale";
import { localeStorageKey } from "./types";

describe("locale helpers", () => {
  test("clears persisted locale before each storage assertion", () => {
    window.localStorage.clear();
    expect(readStoredLocale(window.localStorage)).toBeUndefined();
  });

  test("normalizes supported and regional browser locales", () => {
    expect(normalizeLocale("zh-CN")).toBe("zh-CN");
    expect(normalizeLocale("zh-HK")).toBe("zh-TW");
    expect(normalizeLocale("en-GB")).toBe("en-US");
    expect(normalizeLocale("fr-FR")).toBe("zh-CN");
  });

  test("prefers stored locale before browser locale", () => {
    const storage = window.localStorage;
    storage.clear();

    persistLocale(storage, "zh-TW");

    expect(readStoredLocale(storage)).toBe("zh-TW");
    expect(storage.getItem(localeStorageKey)).toBe("zh-TW");
    expect(getInitialLocale(storage, "en-US")).toBe("zh-TW");
  });
});

import { expect, test } from "vitest";
import {
  readThemePreference,
  getNextThemePreference,
  themePreferenceStorageKey,
  writeThemePreference,
} from "./theme";

/** Verifies that the theme preference defaults to light. */
test("defaults to light theme preference", () => {
  window.localStorage.clear();

  expect(readThemePreference(window.localStorage)).toBe("light");
});

/** Verifies that invalid stored preferences are ignored. */
test("ignores invalid stored theme preferences", () => {
  window.localStorage.setItem(themePreferenceStorageKey, "sepia");

  expect(readThemePreference(window.localStorage)).toBe("light");
});

/** Verifies that selected theme preferences are persisted. */
test("writes selected theme preferences", () => {
  writeThemePreference(window.localStorage, "dark");

  expect(readThemePreference(window.localStorage)).toBe("dark");
});

/** Verifies the next theme used by the single-click toggle. */
test("returns the next theme preference", () => {
  expect(getNextThemePreference("light")).toBe("dark");
  expect(getNextThemePreference("dark")).toBe("light");
});

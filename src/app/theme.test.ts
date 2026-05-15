import { expect, test } from "vitest";
import {
  readThemePreference,
  resolveThemePreference,
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

/** Verifies concrete theme resolution from user and system preferences. */
test("resolves system theme preferences", () => {
  expect(resolveThemePreference("system", true)).toBe("dark");
  expect(resolveThemePreference("system", false)).toBe("light");
  expect(resolveThemePreference("light", true)).toBe("light");
  expect(resolveThemePreference("dark", false)).toBe("dark");
});

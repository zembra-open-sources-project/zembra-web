export type ThemePreference = "light" | "dark";

export type ResolvedTheme = "light" | "dark";

export const themePreferenceStorageKey = "zembra-theme-preference";

const themePreferences = new Set<ThemePreference>(["light", "dark"]);

/** Returns whether a stored string is a supported theme preference. */
export function isThemePreference(value: string | null): value is ThemePreference {
  return value !== null && themePreferences.has(value as ThemePreference);
}

/** Reads the saved theme preference, falling back to light by default. */
export function readThemePreference(storage: Storage): ThemePreference {
  const storedValue = storage.getItem(themePreferenceStorageKey);

  return isThemePreference(storedValue) ? storedValue : "light";
}

/** Persists the selected theme preference. */
export function writeThemePreference(
  storage: Storage,
  preference: ThemePreference,
): void {
  storage.setItem(themePreferenceStorageKey, preference);
}

/** Returns the opposite theme for single-click toggling. */
export function getNextThemePreference(preference: ThemePreference): ThemePreference {
  return preference === "light" ? "dark" : "light";
}

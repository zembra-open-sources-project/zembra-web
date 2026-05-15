export type ThemePreference = "system" | "light" | "dark";

export type ResolvedTheme = "light" | "dark";

export const themePreferenceStorageKey = "zembra-theme-preference";

const themePreferences = new Set<ThemePreference>(["system", "light", "dark"]);

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

/** Resolves a theme preference to the concrete theme applied to the DOM. */
export function resolveThemePreference(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }

  return preference;
}

/** Returns the current system dark-mode preference. */
export function getSystemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

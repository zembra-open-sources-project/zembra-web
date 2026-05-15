import {
  defaultLocale,
  localeStorageKey,
  supportedLocales,
  type SupportedLocale,
} from "./types";

/** Returns whether the provided locale is directly supported by the app. */
export function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

/** Normalizes persisted or browser locale strings to an app-supported locale. */
export function normalizeLocale(value: string | undefined): SupportedLocale {
  if (!value) {
    return defaultLocale;
  }

  if (isSupportedLocale(value)) {
    return value;
  }

  const normalized = value.toLowerCase();

  if (normalized === "zh-hk" || normalized === "zh-mo" || normalized === "zh-tw") {
    return "zh-TW";
  }

  if (normalized.startsWith("zh")) {
    return "zh-CN";
  }

  if (normalized.startsWith("en")) {
    return "en-US";
  }

  return defaultLocale;
}

/** Reads the stored locale preference from localStorage when it is available. */
export function readStoredLocale(storage: Storage): SupportedLocale | undefined {
  const storedLocale = storage.getItem(localeStorageKey);

  return storedLocale ? normalizeLocale(storedLocale) : undefined;
}

/** Returns the initial locale using stored preference before browser language. */
export function getInitialLocale(storage: Storage, language: string): SupportedLocale {
  return readStoredLocale(storage) ?? normalizeLocale(language);
}

/** Persists the selected locale to localStorage. */
export function persistLocale(storage: Storage, locale: SupportedLocale): void {
  storage.setItem(localeStorageKey, locale);
}

/** Synchronizes the document language attribute with the current locale. */
export function syncDocumentLocale(locale: SupportedLocale): void {
  document.documentElement.lang = locale;
}

export const supportedLocales = ["zh-CN", "zh-TW", "en-US"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "zh-CN";

export const fallbackLocale: SupportedLocale = "en-US";

export const localeStorageKey = "zembra.locale";

export interface LocaleOption {
  /** Stable locale identifier used by i18next and HTML lang. */
  locale: SupportedLocale;
  /** Human-readable language name shown in the language menu. */
  label: string;
}

export const localeOptions: LocaleOption[] = [
  { locale: "zh-CN", label: "简体中文" },
  { locale: "zh-TW", label: "繁體中文" },
  { locale: "en-US", label: "English" },
];

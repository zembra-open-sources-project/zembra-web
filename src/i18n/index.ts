import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getInitialLocale, syncDocumentLocale } from "./locale";
import { resources } from "./resources";
import { defaultLocale, fallbackLocale } from "./types";

const initialLocale =
  typeof window === "undefined"
    ? defaultLocale
    : getInitialLocale(window.localStorage, window.navigator.language);

void i18next.use(initReactI18next).init({
  defaultNS: "common",
  fallbackLng: fallbackLocale,
  interpolation: {
    escapeValue: false,
  },
  lng: initialLocale,
  ns: ["common", "home", "settings"],
  resources,
});

if (typeof document !== "undefined") {
  syncDocumentLocale(initialLocale);
}

export { i18next };

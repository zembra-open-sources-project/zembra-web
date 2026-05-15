import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  readThemePreference,
  ThemePreference,
  writeThemePreference,
} from "./theme";

interface ThemeContextValue {
  /** User-selected theme preference applied to the document. */
  preference: ThemePreference;
  /** Updates and persists the user-selected theme preference. */
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Provides application theme state and synchronizes it to the document root. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readThemePreference(window.localStorage),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = preference;
  }, [preference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference(nextPreference) {
        writeThemePreference(window.localStorage, nextPreference);
        setPreferenceState(nextPreference);
      },
    }),
    [preference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Returns the current theme context. */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

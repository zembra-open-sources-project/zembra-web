import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { getNextThemePreference } from "./theme";

/** Renders a single-click light and dark theme toggle. */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const nextPreference = getNextThemePreference(preference);
  const Icon = preference === "dark" ? Moon : Sun;
  const label =
    preference === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-[inset_0_0_0_1px_var(--color-border)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setPreference(nextPreference)}
    >
      <Icon
        className="size-4 text-[var(--color-accent)]"
        aria-hidden="true"
      />
    </button>
  );
}

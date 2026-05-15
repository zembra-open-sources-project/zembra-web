import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import type { ThemePreference } from "./theme";

const themeOptions: Array<{
  /** Stable option value stored as the theme preference. */
  value: ThemePreference;
  /** User-facing label for the option. */
  label: string;
}> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Renders a compact theme preference selector. */
export function ThemeToggle() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const Icon =
    preference === "system" ? Laptop : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <label className="relative inline-flex h-[34px] shrink-0 items-center gap-2 rounded-[9px] bg-[var(--color-surface)] px-2.5 text-[13px] font-semibold text-[var(--color-text-secondary)] shadow-[inset_0_0_0_1px_var(--color-border)] hover:text-[var(--color-text-primary)]">
      <Icon
        className="size-4 text-[var(--color-accent)]"
        aria-hidden="true"
      />
      <select
        className="max-w-[78px] appearance-none bg-transparent pr-1 text-[13px] outline-none"
        aria-label="Theme"
        value={preference}
        onChange={(event) =>
          setPreference(event.target.value as ThemePreference)
        }
      >
        {themeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

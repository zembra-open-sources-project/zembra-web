import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ThemeProvider } from "./ThemeProvider";
import { themePreferenceStorageKey } from "./theme";
import { ThemeToggle } from "./ThemeToggle";

/** Verifies that the icon-only theme button toggles from light to dark. */
test("toggles from light to dark on click", () => {
  window.localStorage.clear();
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );

  const button = screen.getByRole("button", { name: "Switch to dark theme" });

  expect(button.textContent).toBe("");

  fireEvent.click(button);

  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(window.localStorage.getItem(themePreferenceStorageKey)).toBe("dark");
  expect(
    screen.getByRole("button", { name: "Switch to light theme" }),
  ).not.toBeNull();
});

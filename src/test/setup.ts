import { vi } from "vitest";
import "../i18n";

/** Provides browser APIs that are not implemented by jsdom. */
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

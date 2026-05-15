import { vi } from "vitest";

/** Provides browser APIs that are not implemented by jsdom. */
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

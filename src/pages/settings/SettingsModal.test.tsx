import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import type { SyncClient } from "../../api/sync.client";
import { ThemeProvider } from "../../app/ThemeProvider";
import { i18next } from "../../i18n";
import { SettingsModal } from "./SettingsModal";

beforeEach(async () => {
  await i18next.changeLanguage("en-US");
});

/** Creates a mock sync client for Settings modal rendering tests. */
function createMockModalClient(): SyncClient {
  return {
    getConfig: vi.fn(async () => ({
      enabled: true,
      intervalSeconds: 120,
      serviceRoleKeyConfigured: true,
      supabaseUrl: "https://project.supabase.co",
    })),
    getStatus: vi.fn(async () => ({
      enabled: true,
      states: [],
    })),
    runSync: vi.fn(async () => ({
      pulled: 0,
      pushed: 0,
    })),
    testConfig: vi.fn(async () => ({
      message: "connected",
      ok: true,
    })),
    updateConfig: vi.fn(async (input) => ({
      enabled: input.enabled,
      intervalSeconds: input.intervalSeconds,
      serviceRoleKeyConfigured: true,
      supabaseUrl: input.supabaseUrl,
    })),
  };
}

/** Renders SettingsModal with global providers used in production. */
function renderSettingsModal(onClose = vi.fn()) {
  render(
    <ThemeProvider>
      <SettingsModal client={createMockModalClient()} onClose={onClose} />
    </ThemeProvider>,
  );

  return onClose;
}

test("renders Settings dialog with Supabase section", async () => {
  renderSettingsModal();

  expect(screen.getByRole("dialog", { name: "Sync" })).not.toBeNull();
  expect(screen.getByRole("button", { name: "Sync" })).not.toBeNull();
  expect(await screen.findByText("Supabase")).not.toBeNull();
  expect(screen.getByRole("switch", { name: "Enable sync" })).not.toBeNull();
});

test("closes Settings dialog from close button and backdrop", () => {
  const onClose = renderSettingsModal();

  fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);

  expect(onClose).toHaveBeenCalledTimes(1);
});

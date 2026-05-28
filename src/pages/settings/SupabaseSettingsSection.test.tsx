import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { SyncClient } from "../../api/sync.client";
import { ThemeProvider } from "../../app/ThemeProvider";
import { i18next } from "../../i18n";
import { SupabaseSettingsSection } from "./SupabaseSettingsSection";

let client: SyncClient;

beforeEach(async () => {
  window.localStorage.clear();
  await i18next.changeLanguage("en-US");
  client = createMockSectionClient();
});

/** Creates a mock sync client for Supabase settings section tests. */
function createMockSectionClient(): SyncClient {
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
      pulled: 3,
      pushed: 2,
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

/** Renders the Supabase settings section with production providers. */
function renderSupabaseSection() {
  return render(
    <ThemeProvider>
      <SupabaseSettingsSection client={client} />
    </ThemeProvider>,
  );
}

describe("SupabaseSettingsSection", () => {
  test("loads persisted Supabase configuration", async () => {
    renderSupabaseSection();

    expect(await screen.findByDisplayValue("https://project.supabase.co")).not.toBeNull();
    expect(screen.getByDisplayValue("120")).not.toBeNull();
    expect(
      (screen.getByRole("switch", { name: "Enable sync" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(screen.queryByText(/Configured|Not configured/)).toBeNull();
  });

  test("places Enable sync after required connection fields", async () => {
    renderSupabaseSection();

    await screen.findByDisplayValue("https://project.supabase.co");

    const urlLabel = screen.getByText("Supabase URL");
    const intervalLabel = screen.getByText("Interval seconds");
    const enableSwitch = screen.getByRole("switch", { name: "Enable sync" });

    expect(
      urlLabel.compareDocumentPosition(enableSwitch) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect(
      intervalLabel.compareDocumentPosition(enableSwitch) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
  });

  test("tests candidate configuration without saving or running sync", async () => {
    renderSupabaseSection();

    await screen.findByDisplayValue("https://project.supabase.co");
    fireEvent.click(screen.getByRole("button", { name: "Test" }));

    await waitFor(() => {
      expect(client.testConfig).toHaveBeenCalledWith({
        serviceRoleKey: "",
        supabaseUrl: "https://project.supabase.co",
      });
    });
    expect(await screen.findByText("connected")).not.toBeNull();
    expect(client.updateConfig).not.toHaveBeenCalled();
    expect(client.runSync).not.toHaveBeenCalled();
  });

  test("saves valid settings without running manual sync", async () => {
    renderSupabaseSection();

    const urlInput = await screen.findByDisplayValue("https://project.supabase.co");
    const keyInput = screen.getByPlaceholderText("Leave blank to keep existing secret");

    fireEvent.change(urlInput, {
      target: { value: "https://next.supabase.co" },
    });
    fireEvent.change(keyInput, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalledWith({
        enabled: true,
        intervalSeconds: 120,
        serviceRoleKey: "   ",
        supabaseUrl: "https://next.supabase.co",
      });
    });
    expect(await screen.findByText("Settings saved")).not.toBeNull();
    expect(client.runSync).not.toHaveBeenCalled();
  });

  test("persists Enable sync switch changes", async () => {
    client = {
      ...createMockSectionClient(),
      getConfig: vi.fn(async () => ({
        enabled: false,
        intervalSeconds: 120,
        serviceRoleKeyConfigured: true,
        supabaseUrl: "https://project.supabase.co",
      })),
    };

    renderSupabaseSection();

    const switchInput = await screen.findByRole("switch", { name: "Enable sync" });
    fireEvent.click(switchInput);

    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalledWith({
        enabled: true,
        intervalSeconds: 120,
        serviceRoleKey: "",
        supabaseUrl: "https://project.supabase.co",
      });
    });
    expect((switchInput as HTMLInputElement).checked).toBe(true);
  });

  test("rolls back Enable sync when persistence fails", async () => {
    client = {
      ...createMockSectionClient(),
      updateConfig: vi.fn(async () => {
        throw new Error("Save failed");
      }),
    };

    renderSupabaseSection();

    const switchInput = await screen.findByRole("switch", { name: "Enable sync" });
    expect((switchInput as HTMLInputElement).checked).toBe(true);

    fireEvent.click(switchInput);

    expect(await screen.findByText("Save failed")).not.toBeNull();
    expect((switchInput as HTMLInputElement).checked).toBe(true);
  });
});

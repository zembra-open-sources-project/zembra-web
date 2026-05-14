import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { SyncClient } from "../../api/sync.client";
import { SyncSettingsPage } from "./SyncSettingsPage";

let client: SyncClient;

beforeEach(() => {
  client = createMockPageClient();
});

/** Creates a mock sync client for settings page interaction tests. */
function createMockPageClient(): SyncClient {
  return {
    getConfig: vi.fn(async () => ({
      enabled: true,
      intervalSeconds: 120,
      supabaseUrl: "https://project.supabase.co",
      serviceRoleKeyConfigured: true,
    })),
    updateConfig: vi.fn(async (input) => ({
      enabled: input.enabled,
      intervalSeconds: input.intervalSeconds,
      supabaseUrl: input.supabaseUrl,
      serviceRoleKeyConfigured: true,
    })),
    testConfig: vi.fn(async () => ({
      ok: true,
      message: "connected",
    })),
    getStatus: vi.fn(async () => ({
      enabled: true,
      states: [
        {
          workspaceId: "workspace-1",
          deviceId: "device-1",
          scope: "push",
          lastChangeCreatedAt: 10,
          lastChangeId: "change-1",
          lastSuccessAt: 20,
          lastErrorAt: null,
          lastErrorMessage: null,
        },
      ],
    })),
    runSync: vi.fn(async () => ({
      pushed: 2,
      pulled: 3,
    })),
  };
}

describe("SyncSettingsPage", () => {
  test("loads configuration, key state, and status", async () => {
    render(<SyncSettingsPage client={client} />);

    expect(await screen.findByDisplayValue("https://project.supabase.co")).not.toBeNull();
    expect(screen.getByDisplayValue("120")).not.toBeNull();
    expect(screen.getByText("Configured")).not.toBeNull();
    expect(screen.getByText("workspace-1 / device-1")).not.toBeNull();
  });

  test("saves valid settings without sending a blank service role key", async () => {
    render(<SyncSettingsPage client={client} />);

    const urlInput = await screen.findByDisplayValue("https://project.supabase.co");
    const keyInput = screen.getByPlaceholderText("Leave blank to keep the existing key");

    fireEvent.change(urlInput, {
      target: { value: "https://next.supabase.co" },
    });
    fireEvent.change(keyInput, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalledWith({
        enabled: true,
        intervalSeconds: 120,
        supabaseUrl: "https://next.supabase.co",
        serviceRoleKey: "   ",
      });
    });
    expect(await screen.findByText("Settings saved")).not.toBeNull();
  });

  test("blocks save when interval seconds is not an integer", async () => {
    render(<SyncSettingsPage client={client} />);

    const intervalInput = await screen.findByDisplayValue("120");

    fireEvent.change(intervalInput, { target: { value: "1.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));

    expect(
      screen.getByText("Interval seconds must be 0 or a positive integer"),
    ).not.toBeNull();
    expect(client.updateConfig).not.toHaveBeenCalled();
  });

  test("tests candidate configuration without saving it", async () => {
    render(<SyncSettingsPage client={client} />);

    await screen.findByDisplayValue("https://project.supabase.co");

    fireEvent.click(screen.getByRole("button", { name: "Test Connection" }));

    await waitFor(() => {
      expect(client.testConfig).toHaveBeenCalledWith({
        supabaseUrl: "https://project.supabase.co",
        serviceRoleKey: "",
      });
    });
    expect(await screen.findByText("connected")).not.toBeNull();
    expect(client.updateConfig).not.toHaveBeenCalled();
  });

  test("runs manual synchronization and refreshes status", async () => {
    render(<SyncSettingsPage client={client} />);

    await screen.findByDisplayValue("https://project.supabase.co");

    fireEvent.click(screen.getByRole("button", { name: "Run Sync" }));

    expect(await screen.findByText("Pushed 2, pulled 3")).not.toBeNull();
    expect(client.runSync).toHaveBeenCalled();
    expect(client.getStatus).toHaveBeenCalledTimes(2);
  });
});

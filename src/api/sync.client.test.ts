import { afterEach, describe, expect, test, vi } from "vitest";
import {
  createSyncHttpClient,
  createTestSyncConfigRequest,
  createUpdateSyncConfigRequest,
  mapSyncConfigResponseToDto,
  mapSyncStatusResponseToDto,
} from "./sync.client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

/** Creates a successful JSON fetch response for sync client tests. */
function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createSyncHttpClient", () => {
  test("reads synchronization configuration", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe("http://server.test/sync/config");

      return jsonResponse({
        enabled: true,
        interval_seconds: 120,
        supabase_url: "https://project.supabase.co",
        secret_key_configured: true,
      });
    }) as typeof fetch;

    const client = createSyncHttpClient({ baseUrl: "http://server.test" });

    await expect(client.getConfig()).resolves.toEqual({
      enabled: true,
      intervalSeconds: 120,
      supabaseUrl: "https://project.supabase.co",
      serviceRoleKeyConfigured: true,
    });
  });

  test("saves synchronization configuration with backend field names", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://server.test/sync/config");
      expect(init?.method).toBe("PUT");
      expect(JSON.parse(String(init?.body))).toEqual({
        enabled: true,
        interval_seconds: 60,
        supabase_url: "https://project.supabase.co",
        secret_key: "new-key",
      });

      return jsonResponse({
        enabled: true,
        interval_seconds: 60,
        supabase_url: "https://project.supabase.co",
        secret_key_configured: true,
      });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createSyncHttpClient({ baseUrl: "http://server.test" });

    await expect(
      client.updateConfig({
        enabled: true,
        intervalSeconds: 60,
        supabaseUrl: "https://project.supabase.co",
        serviceRoleKey: " new-key ",
      }),
    ).resolves.toMatchObject({ serviceRoleKeyConfigured: true });
  });

  test("does not overwrite existing service role key when the input is blank", () => {
    expect(
      createUpdateSyncConfigRequest({
        enabled: false,
        intervalSeconds: 0,
        supabaseUrl: "https://project.supabase.co",
        serviceRoleKey: "   ",
      }),
    ).toEqual({
      enabled: false,
      interval_seconds: 0,
      supabase_url: "https://project.supabase.co",
    });
  });

  test("tests synchronization configuration without saving it", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        supabase_url: "https://project.supabase.co",
        secret_key: "candidate-key",
      });

      return jsonResponse({ ok: true, message: "connected" });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createSyncHttpClient({ baseUrl: "http://server.test" });

    await expect(
      client.testConfig({
        supabaseUrl: "https://project.supabase.co",
        serviceRoleKey: "candidate-key",
      }),
    ).resolves.toEqual({ ok: true, message: "connected" });
  });

  test("reads synchronization status", async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({
        enabled: true,
        states: [
          {
            workspace_id: "workspace-1",
            device_id: "device-1",
            scope: "push",
            last_change_created_at: 10,
            last_change_id: "change-1",
            last_success_at: 20,
            last_error_at: null,
            last_error_message: null,
          },
        ],
      }),
    ) as typeof fetch;

    const client = createSyncHttpClient({ baseUrl: "http://server.test" });

    await expect(client.getStatus()).resolves.toEqual({
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
    });
  });

  test("runs one manual synchronization cycle", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://server.test/sync/run");
      expect(init?.method).toBe("POST");

      return jsonResponse({ pushed: 2, pulled: 3 });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createSyncHttpClient({ baseUrl: "http://server.test" });

    await expect(client.runSync()).resolves.toEqual({ pushed: 2, pulled: 3 });
  });
});

describe("sync client mapping helpers", () => {
  test("maps backend configuration response to frontend fields", () => {
    expect(
      mapSyncConfigResponseToDto({
        enabled: true,
        interval_seconds: 30,
        supabase_url: "https://project.supabase.co",
        secret_key_configured: false,
      }),
    ).toEqual({
      enabled: true,
      intervalSeconds: 30,
      supabaseUrl: "https://project.supabase.co",
      serviceRoleKeyConfigured: false,
    });
  });

  test("maps backend status response to frontend fields", () => {
    expect(
      mapSyncStatusResponseToDto({
        enabled: false,
        states: [
          {
            workspace_id: "workspace-1",
            device_id: "device-1",
            scope: "pull",
            last_change_created_at: 1,
            last_change_id: "change-1",
          },
        ],
      }),
    ).toMatchObject({
      enabled: false,
      states: [{ workspaceId: "workspace-1", scope: "pull" }],
    });
  });

  test("normalizes blank test fields to null", () => {
    expect(createTestSyncConfigRequest({ serviceRoleKey: " " })).toEqual({
      supabase_url: null,
      secret_key: null,
    });
  });
});

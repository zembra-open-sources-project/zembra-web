import { afterEach, describe, expect, test, vi } from "vitest";
import { listWorkspaces, resolveDefaultWorkspaceId } from "./client";
import { setConfiguredWorkspaceId } from "./backendConfig";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
  vi.restoreAllMocks();
});

/** Creates a successful JSON fetch response for API boundary tests. */
function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("listWorkspaces", () => {
  test("loads workspaces from the configured backend root", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        workspaces: [
          {
            workspace_id: "workspace-abc123",
            workspace_name: "Product",
            short_hash: "abc123",
            visible_note_count: 3,
            latest_note_created_at: 10,
          },
        ],
      }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    await expect(listWorkspaces()).resolves.toEqual({
      workspaces: [
        {
          workspace_id: "workspace-abc123",
          workspace_name: "Product",
          short_hash: "abc123",
          visible_note_count: 3,
          latest_note_created_at: 10,
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://127.0.0.1:3000/workspaces"),
      expect.objectContaining({ method: "GET" }),
    );
  });
});

describe("resolveDefaultWorkspaceId", () => {
  test("uses the saved workspace ID when no environment workspace is configured", async () => {
    setConfiguredWorkspaceId("workspace-saved");

    await expect(resolveDefaultWorkspaceId()).resolves.toBe("workspace-saved");
  });

  test("throws a clear error when no workspace ID is configured", async () => {
    await expect(resolveDefaultWorkspaceId()).rejects.toThrow(
      "No workspace available for note API requests",
    );
  });
});

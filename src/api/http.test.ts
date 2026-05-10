import { afterEach, describe, expect, test, vi } from "vitest";
import { subscribeBackendConnectionFailed } from "../app/backendConnectionToast";
import { ApiError, requestJson } from "./http";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

/** Creates a JSON fetch response for requestJson tests. */
function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("requestJson", () => {
  test("notifies when the backend connection fails", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeBackendConnectionFailed(listener);
    const networkError = new TypeError("Failed to fetch");
    globalThis.fetch = vi.fn(async () => {
      throw networkError;
    }) as typeof fetch;

    try {
      await expect(
        requestJson("http://server.test", "/notes"),
      ).rejects.toBe(networkError);
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      unsubscribe();
    }
  });

  test("does not notify for backend HTTP errors", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeBackendConnectionFailed(listener);
    globalThis.fetch = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: "validation_error",
            message: "content is required",
            details: {},
          },
        },
        { status: 422 },
      ),
    ) as typeof fetch;

    try {
      await expect(
        requestJson("http://server.test", "/notes"),
      ).rejects.toMatchObject({
        name: "ApiError",
        status: 422,
        code: "validation_error",
      } satisfies Partial<ApiError>);
      expect(listener).not.toHaveBeenCalled();
    } finally {
      unsubscribe();
    }
  });
});


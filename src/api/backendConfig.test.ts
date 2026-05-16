import { afterEach, describe, expect, test, vi } from "vitest";
import {
  backendBaseUrlStorageKey,
  checkBackendReachability,
  createBackendHealthUrl,
  createBackendBaseUrl,
  getConfiguredBackendBaseUrl,
  normalizeBackendBaseUrl,
  parseBackendEndpoint,
  setConfiguredBackendBaseUrl,
} from "./backendConfig";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("backend config", () => {
  test("parses backend service roots into host and port fields", () => {
    expect(parseBackendEndpoint("http://127.0.0.1:3000")).toEqual({
      host: "127.0.0.1",
      port: "3000",
    });
  });

  test("creates backend service roots from host and port fields", () => {
    expect(createBackendBaseUrl("127.0.0.1", "3000")).toBe(
      "http://127.0.0.1:3000",
    );
    expect(createBackendBaseUrl("localhost", "")).toBe("http://localhost");
  });

  test("normalizes backend URLs before storage", () => {
    setConfiguredBackendBaseUrl("127.0.0.1:3000");

    expect(window.localStorage.getItem(backendBaseUrlStorageKey)).toBe(
      "http://127.0.0.1:3000",
    );
    expect(getConfiguredBackendBaseUrl()).toBe("http://127.0.0.1:3000");
  });

  test("creates health URLs from backend service root URLs", () => {
    expect(createBackendHealthUrl("http://127.0.0.1:3000")).toBe(
      "http://127.0.0.1:3000/health",
    );
  });

  test("checks documented backend health endpoint directly", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    ) as typeof fetch;

    await expect(checkBackendReachability("127.0.0.1:3000")).resolves.toBe(
      true,
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/health",
      expect.objectContaining({ method: "GET" }),
    );
    expect(infoSpy).toHaveBeenCalledWith(
      "[zembra] Checking backend reachability",
      expect.objectContaining({
        baseUrl: "http://127.0.0.1:3000",
        healthUrl: "http://127.0.0.1:3000/health",
      }),
    );
  });

  test("logs network failures during reachability checks", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = new TypeError("Failed to fetch");
    globalThis.fetch = vi.fn(async () => {
      throw error;
    }) as typeof fetch;

    await expect(checkBackendReachability("http://server.test")).resolves.toBe(
      false,
    );

    expect(warnSpy).toHaveBeenCalledWith(
      "[zembra] Backend reachability check failed",
      expect.objectContaining({
        error,
        hint:
          "If curl succeeds but the browser fails, verify backend CORS allows the WebUI origin.",
        healthUrl: "http://server.test/health",
      }),
    );
  });
});

describe("normalizeBackendBaseUrl", () => {
  test("adds http protocol and returns the service root URL", () => {
    expect(normalizeBackendBaseUrl(" 127.0.0.1:3000/ ")).toBe(
      "http://127.0.0.1:3000",
    );
  });
});

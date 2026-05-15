import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { App } from "./App";
import { notifyBackendConnectionFailed } from "./backendConnectionToast";
import { i18next } from "../i18n";
import { backendBaseUrlStorageKey } from "../api/backendConfig";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.localStorage.clear();
  void i18next.changeLanguage("zh-CN");
});

/** Verifies that the backend URL gate renders before the workspace. */
test("renders the backend URL gate before the workspace", async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  render(<App />);

  expect(await screen.findByRole("button", { name: /backend/i })).not.toBeNull();
  expect(screen.getByLabelText("Backend URL")).not.toBeNull();
});

/** Verifies that a reachable backend URL is saved before rendering notes. */
test("saves a reachable backend URL and renders the card note workspace", async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status: 204 }),
  );
  render(<App />);

  fireEvent.change(await screen.findByLabelText("Backend URL"), {
    target: { value: "127.0.0.1:8000" },
  });
  fireEvent.click(screen.getByRole("button", { name: /backend/i }));

  expect(await screen.findByText("LOCAL")).not.toBeNull();
  expect(globalThis.fetch).toHaveBeenCalledWith(
    "http://127.0.0.1:8000/health",
    expect.objectContaining({ method: "GET" }),
  );
  expect(window.localStorage.getItem(backendBaseUrlStorageKey)).toBe(
    "http://127.0.0.1:8000",
  );
});

/** Verifies that unreachable user-entered URLs keep the gate visible. */
test("shows an error when the entered backend URL is unreachable", async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("failed"));
  render(<App />);

  fireEvent.change(await screen.findByLabelText("Backend URL"), {
    target: { value: "http://127.0.0.1:9000" },
  });
  fireEvent.click(screen.getByRole("button", { name: /backend/i }));

  expect(await screen.findByRole("alert")).not.toBeNull();
  expect(window.localStorage.getItem(backendBaseUrlStorageKey)).toBeNull();
});

/** Verifies that a saved unreachable URL sends the user back to the gate. */
test("returns to the backend URL gate when the saved URL is unreachable", async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  window.localStorage.setItem(
    backendBaseUrlStorageKey,
    "http://127.0.0.1:9000",
  );
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status: 503 }),
  );
  render(<App />);

  expect(await screen.findByRole("alert")).not.toBeNull();
  expect(window.localStorage.getItem(backendBaseUrlStorageKey)).toBeNull();
});

/** Verifies that backend connection failures surface as temporary toast UI. */
test("shows backend connection toast for five seconds", async () => {
  vi.useFakeTimers();
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status: 204 }),
  );
  window.localStorage.setItem(
    backendBaseUrlStorageKey,
    "http://127.0.0.1:8000",
  );
  render(<App />);

  act(() => notifyBackendConnectionFailed());

  expect(screen.getByRole("status").textContent).toBe(
    "无法连接到 backend，请确认服务已启动",
  );

  act(() => {
    vi.advanceTimersByTime(5000);
  });

  expect(screen.queryByRole("status")).toBeNull();
});

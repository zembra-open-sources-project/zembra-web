import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { App } from "./App";
import { notifyBackendConnectionFailed } from "./backendConnectionToast";
import { i18next } from "../i18n";
import {
  backendBaseUrlStorageKey,
  workspaceIdStorageKey,
} from "../api/backendConfig";

beforeEach(async () => {
  await i18next.changeLanguage("zh-CN");
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

/** Verifies that the backend URL gate renders before the workspace. */
test("renders the backend URL gate before the workspace", async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  render(<App />);

  expect(
    await screen.findByRole("button", { name: "加载 workspace" }),
  ).not.toBeNull();
  expect(
    (screen.getByRole("button", { name: "进入 Zembra" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  const hostInput = screen.getByLabelText("IP / Host") as HTMLInputElement;
  const portInput = screen.getByLabelText("Port") as HTMLInputElement;
  expect((screen.getByLabelText("Workspace") as HTMLSelectElement).disabled).toBe(
    true,
  );
  expect(hostInput.value).toBe("");
  expect(hostInput.placeholder).toBe("IP / Host: 127.0.0.1");
  expect(portInput.value).toBe("");
  expect(portInput.placeholder).toBe("Port: 3000");
});

/** Verifies that the default backend URL is used when the user leaves input empty. */
test("uses the default backend URL when the input is empty", async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);

    if (url === "http://127.0.0.1:3000/health") {
      return new Response(null, { status: 204 });
    }

    return new Response(
      JSON.stringify({
        workspaces: [
          {
            workspace_id: "workspace-default",
            workspace_name: "Default",
            short_hash: "default",
            visible_note_count: 1,
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: "加载 workspace" }));

  expect(await screen.findByDisplayValue(/Default/)).not.toBeNull();
  expect(screen.queryByText("LOCAL")).toBeNull();
  expect(globalThis.fetch).toHaveBeenCalledWith(
    "http://127.0.0.1:3000/health",
    expect.objectContaining({ method: "GET" }),
  );
  expect(window.localStorage.getItem(backendBaseUrlStorageKey)).toBe(
    "http://127.0.0.1:3000",
  );
});

/** Verifies that workspace selection is saved before rendering notes. */
test("saves a reachable backend URL and selected workspace before rendering notes", async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);

    if (url === "http://127.0.0.1:8000/health") {
      return new Response(null, { status: 204 });
    }

    return new Response(
      JSON.stringify({
        workspaces: [
          {
            workspace_id: "workspace-small",
            workspace_name: "Small",
            short_hash: "small",
            visible_note_count: 2,
          },
          {
            workspace_id: "workspace-large",
            workspace_name: "Large",
            short_hash: "large",
            visible_note_count: 5,
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
  render(<App />);

  fireEvent.change(await screen.findByLabelText("IP / Host"), {
    target: { value: "127.0.0.1" },
  });
  fireEvent.change(screen.getByLabelText("Port"), { target: { value: "8000" } });
  fireEvent.click(screen.getByRole("button", { name: "加载 workspace" }));

  expect(await screen.findByDisplayValue(/Large/)).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "进入 Zembra" }));
  expect(await screen.findByText("LOCAL")).not.toBeNull();
  expect(globalThis.fetch).toHaveBeenCalledWith(
    "http://127.0.0.1:8000/health",
    expect.objectContaining({ method: "GET" }),
  );
  expect(window.localStorage.getItem(backendBaseUrlStorageKey)).toBe(
    "http://127.0.0.1:8000",
  );
  expect(window.localStorage.getItem(workspaceIdStorageKey)).toBe(
    "workspace-large",
  );
});

/** Verifies that workspace options separate hashes from note counts. */
test("formats unnamed workspace options with hash and note count", async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    if (String(input).endsWith("/health")) {
      return new Response(null, { status: 204 });
    }

    return new Response(
      JSON.stringify({
        workspaces: [
          {
            workspace_id: "abcdef1234567890",
            workspace_name: null,
            short_hash: "abcdef",
            visible_note_count: 4,
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: "加载 workspace" }));

  expect(
    await screen.findByDisplayValue("abcdef(note count: 4)"),
  ).not.toBeNull();
});

/** Verifies that unreachable user-entered URLs keep the gate visible. */
test("shows an error when the entered backend URL is unreachable", async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("failed"));
  render(<App />);

  fireEvent.change(await screen.findByLabelText("IP / Host"), {
    target: { value: "http://127.0.0.1:9000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "加载 workspace" }));

  expect(await screen.findByRole("alert")).not.toBeNull();
  expect(window.localStorage.getItem(backendBaseUrlStorageKey)).toBeNull();
});

/** Verifies that empty workspace lists keep the gate visible. */
test("does not enter the app when the backend has no workspaces", async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    if (String(input).endsWith("/health")) {
      return new Response(null, { status: 204 });
    }

    return new Response(JSON.stringify({ workspaces: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: "加载 workspace" }));

  expect((await screen.findByRole("alert")).textContent).toBe(
    "没有可用 workspace，不能进入首页。",
  );
  expect(
    (screen.getByRole("button", { name: "进入 Zembra" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(screen.queryByText("LOCAL")).toBeNull();
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

/** Verifies that unavailable saved workspace IDs are cleared. */
test("clears an unavailable saved workspace and keeps the gate visible", async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  window.localStorage.setItem(
    backendBaseUrlStorageKey,
    "http://127.0.0.1:8000",
  );
  window.localStorage.setItem(workspaceIdStorageKey, "workspace-missing");
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    if (String(input).endsWith("/health")) {
      return new Response(null, { status: 204 });
    }

    return new Response(
      JSON.stringify({
        workspaces: [
          {
            workspace_id: "workspace-present",
            workspace_name: "Present",
            short_hash: "present",
            visible_note_count: 2,
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
  render(<App />);

  expect(await screen.findByRole("alert")).not.toBeNull();
  expect(window.localStorage.getItem(workspaceIdStorageKey)).toBeNull();
  expect(await screen.findByDisplayValue(/Present/)).not.toBeNull();
  expect(screen.queryByText("LOCAL")).toBeNull();
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

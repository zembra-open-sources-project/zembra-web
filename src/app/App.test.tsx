import {
  act,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { App } from "./App";
import { notifyBackendConnectionFailed } from "./backendConnectionToast";

afterEach(() => {
  vi.useRealTimers();
});

/** Verifies that the initial note workspace renders. */
test("renders the card note workspace", async () => {
  render(<App />);

  expect(await screen.findByText("Zembra")).not.toBeNull();
});

/** Verifies that backend connection failures surface as temporary toast UI. */
test("shows backend connection toast for five seconds", async () => {
  vi.useFakeTimers();
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

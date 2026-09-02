import { render, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { DailyNotesHeatmap } from "./HomeSidebar";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Verifies that changing workspace reloads the daily counts for the heatmap. */
test("reloads daily note counts when the active workspace changes", async () => {
  const onDayCountChange = vi.fn();
  const originalGetComputedStyle = window.getComputedStyle;

  vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
    const styles = originalGetComputedStyle(element);
    return {
      ...styles,
      getPropertyValue: (property: string) => {
        if (property === "--heatmap-cell-size") {
          return "16";
        }
        if (property === "--heatmap-cell-gap") {
          return "4";
        }
        return styles.getPropertyValue(property);
      },
    } as CSSStyleDeclaration;
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    value: 300,
  });

  const { rerender } = render(
    <DailyNotesHeatmap
      days={[]}
      onDayCountChange={onDayCountChange}
      workspaceId="workspace-a"
    />,
  );

  await waitFor(() => expect(onDayCountChange).toHaveBeenCalledTimes(1));

  rerender(
    <DailyNotesHeatmap
      days={[]}
      onDayCountChange={onDayCountChange}
      workspaceId="workspace-b"
    />,
  );

  await waitFor(() => expect(onDayCountChange).toHaveBeenCalledTimes(2));
  expect(onDayCountChange).toHaveBeenNthCalledWith(1, 105);
  expect(onDayCountChange).toHaveBeenNthCalledWith(2, 105);
});

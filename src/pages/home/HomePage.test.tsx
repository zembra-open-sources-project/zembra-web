import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { afterEach, beforeEach, expect, test } from "vitest";
import { i18next } from "../../i18n";
import { useNotesStore } from "../../features/notes/noteStore";
import { ThemeProvider } from "../../app/ThemeProvider";
import { HomePage } from "./HomePage";

beforeEach(async () => {
  await i18next.changeLanguage("zh-CN");
});

afterEach(() => {
  useNotesStore.setState({
    fields: [],
    keyword: "",
    notes: [],
    selectedField: undefined,
    selectedTag: undefined,
    tags: [],
  });
});

/** Verifies that inline note editing parses the first field and locks other cards. */
test("edits one note inline and warns when multiple fields are present", async () => {
  renderHomePage();

  const firstNoteText = await screen.findByText(/今天先把卡片笔记/);
  const firstCard = firstNoteText.closest("article");
  expect(firstCard).not.toBeNull();

  fireEvent.doubleClick(firstCard as HTMLElement);

  const editor = within(firstCard as HTMLElement).getByRole("textbox");
  expect((editor as HTMLTextAreaElement).value).toContain("今天先把卡片笔记");

  const secondNoteText = await screen.findByText(/数据库契约来自/);
  const secondCard = secondNoteText.closest("article");
  expect(secondCard).not.toBeNull();

  fireEvent.doubleClick(secondCard as HTMLElement);
  expect(within(secondCard as HTMLElement).queryByRole("textbox")).toBeNull();

  fireEvent.change(editor, {
    target: { value: "@project @archive edited content #api #ui" },
  });

  expect(
    await within(firstCard as HTMLElement).findByText(
      "检测到多个 Field，本次只使用 @project",
    ),
  ).not.toBeNull();

  fireEvent.click(within(firstCard as HTMLElement).getByRole("button", { name: "发送" }));

  expect(await screen.findByText(/edited content/)).not.toBeNull();
  await waitFor(() =>
    expect(screen.queryByText("检测到多个 Field，本次只使用 @project")).toBeNull(),
  );
});

/** Renders HomePage with the providers required by its header controls. */
function renderHomePage() {
  const rootRoute = createRootRoute();
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: HomePage,
  });
  const router = createRouter({ routeTree: rootRoute.addChildren([homeRoute]) });

  render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
  );
}

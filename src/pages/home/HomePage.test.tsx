import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { i18next } from "../../i18n";
import { useNotesStore } from "../../features/notes/noteStore";
import { ThemeProvider } from "../../app/ThemeProvider";
import { HomePage } from "./HomePage";

beforeEach(async () => {
  await i18next.changeLanguage("zh-CN");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: vi.fn(async () => undefined),
    },
  });
});

afterEach(() => {
  useNotesStore.setState(useNotesStore.getInitialState(), true);
  vi.restoreAllMocks();
});

/** Verifies that the sidebar activity heatmap renders daily note counts. */
test("renders daily note count heatmap from store data", async () => {
  renderHomePage();

  expect(
    await screen.findByRole("region", { name: "最近30天笔记热力图" }),
  ).not.toBeNull();
  expect(await screen.findByText("最近活跃")).not.toBeNull();
  expect(await screen.findByText("30 天")).not.toBeNull();
  expect(
    screen
      .getByRole("region", { name: "最近30天笔记热力图" })
      .querySelector(".grid-rows-5"),
  ).not.toBeNull();
  expect((await screen.findAllByLabelText(/3 条笔记/)).length).toBeGreaterThan(0);
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

/** Verifies rendered tag chips are not duplicated in note body text. */
test("renders tag chips without repeating inline tag markers", async () => {
  renderHomePage();

  useNotesStore.setState({
    notes: [
      {
        id: "tagged-note",
        content: "#zembra 界面不要追求agent",
        createdAt: 1_779_382_320,
        updatedAt: 1_779_382_320,
        tags: ["zembra"],
      },
    ],
  });

  const noteText = await screen.findByText("界面不要追求agent");
  const noteCard = noteText.closest("article");
  expect(noteCard).not.toBeNull();

  expect(within(noteCard as HTMLElement).getByText("#zembra")).not.toBeNull();
  expect(within(noteCard as HTMLElement).queryByText(/^#zembra 界面/)).toBeNull();
});

/** Verifies field navigation counts use actual note membership. */
test("renders actual note counts for all and field navigation", async () => {
  renderHomePage();

  await waitFor(() => expect(useNotesStore.getState().notes.length).toBe(2));

  act(() => {
    useNotesStore.setState({
      fields: [
        { id: "inbox-field", name: "inbox", createdAt: 1_779_382_320 },
        { id: "project-field", name: "project", createdAt: 1_779_382_320 },
        { id: "empty-field", name: "empty", createdAt: 1_779_382_320 },
      ],
      notes: [
        {
          id: "note-1",
          content: "inbox note",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          fieldId: "inbox-field",
          tags: [],
        },
        {
          id: "note-2",
          content: "project note",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          fieldId: "project-field",
          tags: [],
        },
        {
          id: "note-3",
          content: "unfiled note",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
      ],
    });
  });

  expect(await sidebarNavCount("全部")).toBe("3");
  expect(await sidebarNavCount("inbox")).toBe("1");
  expect(await sidebarNavCount("project")).toBe("1");
  expect(await sidebarNavCount("empty")).toBe("0");
});

/** Verifies note link menu copy and hover preview behavior. */
test("copies note links and previews linked note content", async () => {
  renderHomePage();
  await waitFor(() => expect(useNotesStore.getState().notes.length).toBe(2));

  const targetNoteId = "abcdef1234567890abcdef1234567890";

  act(() => {
    useNotesStore.setState({
      notes: [
        {
          id: "source-note",
          content: `source [[${targetNoteId}]]`,
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
        {
          id: targetNoteId,
          content: "target preview content",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
      ],
    });
  });

  const sourceText = await screen.findByText("source");
  const sourceCard = sourceText.closest("article");
  expect(sourceCard).not.toBeNull();

  fireEvent.click(
    within(sourceCard as HTMLElement).getByRole("button", { name: "笔记操作" }),
  );
  fireEvent.click(
    within(sourceCard as HTMLElement).getByRole("button", { name: "拷贝链接" }),
  );

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith("source-note");
  expect(await within(sourceCard as HTMLElement).findByText("abcdef")).not.toBeNull();
  expect(within(sourceCard as HTMLElement).queryByText(targetNoteId)).toBeNull();

  fireEvent.mouseEnter(
    within(sourceCard as HTMLElement).getByRole("button", {
      name: "引用笔记 abcdef",
    }),
  );

  expect(await screen.findByText("target preview content")).not.toBeNull();
});

/** Verifies create and edit submissions include parsed note links. */
test("submits parsed note links when creating and editing notes", async () => {
  renderHomePage();
  await waitFor(() => expect(useNotesStore.getState().notes.length).toBe(2));

  const targetNoteId = "abcdef1234567890abcdef1234567890";
  const createNote = vi.fn(async () => undefined);
  const updateNote = vi.fn(async () => undefined);

  act(() => {
    useNotesStore.setState({
      createNote,
      notes: [
        {
          id: "editable-note",
          content: "editable content",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
      ],
      updateNote,
    });
  });

  const composer = await screen.findByPlaceholderText("现在的想法是...");
  fireEvent.change(composer, {
    target: { value: `new [[${targetNoteId}]] #api` },
  });
  fireEvent.submit(composer.closest("form") as HTMLFormElement);

  await waitFor(() =>
    expect(createNote).toHaveBeenCalledWith(
      expect.objectContaining({
        content: `new [[${targetNoteId}]] #api`,
        links: [
          {
            anchorText: `[[${targetNoteId}]]`,
            position: 4,
            targetNoteRef: targetNoteId,
          },
        ],
      }),
    ),
  );

  const editableText = await screen.findByText("editable content");
  const editableCard = editableText.closest("article");
  expect(editableCard).not.toBeNull();

  fireEvent.doubleClick(editableCard as HTMLElement);
  const editor = within(editableCard as HTMLElement).getByRole("textbox");
  fireEvent.change(editor, {
    target: { value: `edited [[${targetNoteId}]]` },
  });
  fireEvent.click(within(editableCard as HTMLElement).getByRole("button", { name: "发送" }));

  await waitFor(() =>
    expect(updateNote).toHaveBeenCalledWith(
      "editable-note",
      expect.objectContaining({
        content: `edited [[${targetNoteId}]]`,
        links: [
          {
            anchorText: `[[${targetNoteId}]]`,
            position: 7,
            targetNoteRef: targetNoteId,
          },
        ],
      }),
    ),
  );
});

/** Finds the count text rendered inside a sidebar navigation row. */
async function sidebarNavCount(label: string): Promise<string> {
  const rowLabel = await screen.findByText(label);
  const row = rowLabel.closest("button");
  expect(row).not.toBeNull();

  return row?.querySelector("span:last-child")?.textContent ?? "";
}

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

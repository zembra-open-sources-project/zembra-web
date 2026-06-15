import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { SyncClient } from "../../api/sync.client";
import { i18next } from "../../i18n";
import { useNotesStore } from "../../features/notes/noteStore";
import { ThemeProvider } from "../../app/ThemeProvider";
import { HomePage } from "./HomePage";

beforeEach(async () => {
  await i18next.changeLanguage("zh-CN");
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
        role: "Human",
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

/** Verifies rendered field metadata is not duplicated in note body text. */
test("renders field metadata without repeating inline field markers", async () => {
  renderHomePage();

  useNotesStore.setState({
    fields: [
      { id: "field-alpha", name: "alpha", createdAt: 1 },
    ],
    notes: [
      {
        id: "field-note",
        content: "@alpha reusable note",
        role: "Human",
        fieldId: "field-alpha",
        createdAt: 1_779_382_320,
        updatedAt: 1_779_382_320,
        tags: [],
      },
    ],
  });

  const noteText = await screen.findByText("reusable note");
  const noteCard = noteText.closest("article");
  expect(noteCard).not.toBeNull();

  expect(within(noteCard as HTMLElement).getByText("@alpha")).not.toBeNull();
  expect(within(noteCard as HTMLElement).queryByText(/^@alpha reusable note/))
    .toBeNull();
});

/** Verifies two-level tag chips render as raw paths without duplicate markers. */
test("renders hierarchical tag chips as raw paths", async () => {
  renderHomePage();

  useNotesStore.setState({
    notes: [
      {
        id: "tagged-path-note",
        content: "#books/hands-on-gpt useful note",
        role: "Human",
        createdAt: 1_779_382_320,
        updatedAt: 1_779_382_320,
        tags: ["books/hands-on-gpt"],
      },
    ],
  });

  const noteText = await screen.findByText("useful note");
  const noteCard = noteText.closest("article");
  expect(noteCard).not.toBeNull();

  expect(
    within(noteCard as HTMLElement).getByText("#books/hands-on-gpt"),
  ).not.toBeNull();
  expect(
    within(noteCard as HTMLElement).queryByText(/^#books\/hands-on-gpt useful note/),
  ).toBeNull();
});

/** Verifies note cards render GFM Markdown semantics without executing raw HTML. */
test("renders note card content as GFM markdown", async () => {
  renderHomePage();

  act(() => {
    useNotesStore.setState({
      notes: [
        {
          id: "markdown-note",
          content: [
            "- first item",
            "- second item",
            "",
            "**important** and `inline code`",
            "",
            "[OpenAI](https://openai.com)",
            "",
            "<span>raw html</span>",
          ].join("\n"),
          role: "Human",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
      ],
    });
  });

  const list = await screen.findByRole("list");
  expect(within(list).getByText("first item")).not.toBeNull();
  expect(within(list).getByText("second item")).not.toBeNull();
  expect((await screen.findByText("important")).tagName.toLowerCase()).toBe("strong");
  expect((await screen.findByText("inline code")).tagName.toLowerCase()).toBe("code");

  const externalLink = await screen.findByRole("link", { name: "OpenAI" });
  expect(externalLink.getAttribute("href")).toBe("https://openai.com");
  expect(externalLink.getAttribute("target")).toBe("_blank");
  expect(externalLink.getAttribute("rel")).toBe("noreferrer");

  const noteCard = list.closest("article");
  expect(noteCard).not.toBeNull();
  expect((noteCard as HTMLElement).querySelector(".note-markdown span")).toBeNull();
  expect((noteCard as HTMLElement).textContent).toContain("<span>raw html</span>");
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
          role: "Human",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          fieldId: "inbox-field",
          tags: [],
        },
        {
          id: "note-2",
          content: "project note",
          role: "Agent",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          fieldId: "project-field",
          tags: [],
        },
        {
          id: "note-3",
          content: "unfiled note",
          role: "Human",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
      ],
    });
  });

  expect(await sidebarNavCount("全部", 1)).toBe("3");
  expect(await sidebarNavCount("inbox")).toBe("1");
  expect(await sidebarNavCount("project")).toBe("1");
  expect(await sidebarNavCount("empty")).toBe("0");
});

/** Verifies role navigation is optional and filters the feed when selected. */
test("renders optional role navigation and filters fields and tags by role", async () => {
  renderHomePage();

  await waitFor(() => expect(useNotesStore.getState().notes.length).toBe(2));

  expect(await screen.findByText("Roles")).not.toBeNull();
  expect(await sidebarNavCount("Human")).toBe("1");
  expect(await sidebarNavCount("Agent")).toBe("1");
  expect(useNotesStore.getState().selectedRole).toBeUndefined();
  expect(useNotesStore.getState().notes.map((note) => note.role).sort()).toEqual([
    "Agent",
    "Human",
  ]);

  await act(async () => {
    fireEvent.click(await screen.findByRole("button", { name: /Agent/ }));
  });

  await waitFor(() =>
    expect(screen.queryByText(/今天先把卡片笔记/)).toBeNull(),
  );
  expect(await screen.findByText(/数据库契约来自/)).not.toBeNull();
  expect(await sidebarNavCount("架构")).toBe("1");
  expect(screen.queryByText("初始化")).toBeNull();

  await act(async () => {
    fireEvent.click(screen.getAllByRole("button", { name: /全部/ })[0]);
  });

  await waitFor(() => expect(useNotesStore.getState().selectedRole).toBeUndefined());
  expect(useNotesStore.getState().notes.map((note) => note.role).sort()).toEqual([
    "Agent",
    "Human",
  ]);
});

/** Verifies tag navigation renders a collapsed two-level tree and filters subtrees. */
test("renders hierarchical tag navigation and filters by root or child path", async () => {
  renderHomePage();

  await waitFor(() => expect(useNotesStore.getState().notes.length).toBe(2));

  act(() => {
    useNotesStore.setState({
      notes: [
        {
          id: "root-tag-note",
          content: "root books note",
          role: "Human",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: ["books"],
        },
        {
          id: "child-tag-note",
          content: "hands on gpt note",
          role: "Human",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: ["books/hands-on-gpt"],
        },
        {
          id: "other-tag-note",
          content: "projects note",
          role: "Human",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: ["projects"],
        },
      ],
      tags: [
        {
          id: "tag-books",
          name: "books",
          path: "books",
          depth: 0,
          createdAt: 1_779_382_320,
        },
        {
          id: "tag-books-gpt",
          name: "hands-on-gpt",
          parentTagId: "tag-books",
          path: "books/hands-on-gpt",
          depth: 1,
          createdAt: 1_779_382_320,
        },
        {
          id: "tag-projects",
          name: "projects",
          path: "projects",
          depth: 0,
          createdAt: 1_779_382_320,
        },
      ],
    });
  });

  expect(await screen.findByText("books")).not.toBeNull();
  expect(screen.queryByText("hands-on-gpt")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "展开 books" }));

  expect(await screen.findByText("hands-on-gpt")).not.toBeNull();

  fireEvent.click(sidebarButtonForText("books"));

  expect(await screen.findByText("root books note")).not.toBeNull();
  expect(await screen.findByText("hands on gpt note")).not.toBeNull();
  await waitFor(() => expect(screen.queryByText("projects note")).toBeNull());

  fireEvent.click(sidebarButtonForText("hands-on-gpt"));

  expect(await screen.findByText("hands on gpt note")).not.toBeNull();
  await waitFor(() => expect(screen.queryByText("root books note")).toBeNull());
});

/** Verifies hierarchical tag filtering accepts legacy leaf-only note tags. */
test("filters hierarchical tag navigation with leaf-only note tags", async () => {
  renderHomePage();

  await waitFor(() => expect(useNotesStore.getState().notes.length).toBe(2));

  act(() => {
    useNotesStore.setState({
      notes: [
        {
          id: "legacy-child-tag-note",
          content: "legacy agent test note",
          role: "Human",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: ["test"],
        },
      ],
      tags: [
        {
          id: "tag-agent",
          name: "Agent",
          path: "Agent",
          depth: 0,
          createdAt: 1_779_382_320,
        },
        {
          id: "tag-agent-test",
          name: "test",
          parentTagId: "tag-agent",
          path: "Agent/test",
          depth: 1,
          createdAt: 1_779_382_320,
        },
      ],
    });
  });

  fireEvent.click(screen.getByRole("button", { name: "展开 Agent" }));
  fireEvent.click(sidebarButtonForText("test"));

  expect(await screen.findByText("legacy agent test note")).not.toBeNull();
  expect(screen.queryByText("最近还没有笔记")).toBeNull();
});

/** Verifies note cards expose human and agent role badges. */
test("renders note card role badges as icons without visible role text", async () => {
  renderHomePage();
  await waitFor(() => expect(useNotesStore.getState().notes.length).toBe(2));

  act(() => {
    useNotesStore.setState({
      notes: [
        {
          id: "human-badge-note",
          content: "human badge card",
          role: "Human",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
        {
          id: "bot-badge-note",
          content: "bot badge card",
          role: "Agent",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
      ],
      roleNavigationNotes: [
        {
          id: "human-badge-note",
          content: "human badge card",
          role: "Human",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
        {
          id: "bot-badge-note",
          content: "bot badge card",
          role: "Agent",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
      ],
    });
  });

  const humanCard = (await screen.findByText("human badge card")).closest("article");
  const botCard = (await screen.findByText("bot badge card")).closest("article");
  expect(humanCard).not.toBeNull();
  expect(botCard).not.toBeNull();

  expect(within(humanCard as HTMLElement).getByLabelText("创建角色：Human")).not.toBeNull();
  expect(within(botCard as HTMLElement).getByLabelText("创建角色：Agent")).not.toBeNull();
  expect(within(humanCard as HTMLElement).queryByText("Human")).toBeNull();
  expect(within(botCard as HTMLElement).queryByText("Agent")).toBeNull();
});

/** Verifies note mention insertion and hover preview behavior. */
test("mentions note links and previews linked note content", async () => {
  renderHomePage();
  await waitFor(() => expect(useNotesStore.getState().notes.length).toBe(2));

  const sourceNoteId = "fedcba1234567890fedcba1234567890";
  const targetNoteId = "abcdef1234567890abcdef1234567890";

  act(() => {
    useNotesStore.setState({
      notes: [
        {
          id: sourceNoteId,
          content: `source [[${targetNoteId}]]`,
          role: "Agent",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
        {
          id: targetNoteId,
          content: "target preview content",
          role: "Human",
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
    within(sourceCard as HTMLElement).getByRole("button", { name: "Mention" }),
  );

  expect((screen.getByPlaceholderText("现在的想法是...") as HTMLTextAreaElement).value)
    .toBe(`[[${sourceNoteId}]]`);
  expect(await within(sourceCard as HTMLElement).findByText("abcdef")).not.toBeNull();
  expect(within(sourceCard as HTMLElement).queryByText(targetNoteId)).toBeNull();

  fireEvent.mouseEnter(
    within(sourceCard as HTMLElement).getByRole("button", {
      name: "引用笔记 abcdef",
    }),
  );

  expect(await screen.findByText("target preview content")).not.toBeNull();
});

/** Verifies mention inserts into the active inline editor when a note is being edited. */
test("mentions note links into the active edit draft", async () => {
  renderHomePage();
  await waitFor(() => expect(useNotesStore.getState().notes.length).toBe(2));

  act(() => {
    useNotesStore.setState({
      notes: [
        {
          id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          content: "editable content",
          role: "Human",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
        {
          id: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          content: "target content",
          role: "Agent",
          createdAt: 1_779_382_320,
          updatedAt: 1_779_382_320,
          tags: [],
        },
      ],
    });
  });

  const editableCard = (await screen.findByText("editable content")).closest("article");
  const targetCard = (await screen.findByText("target content")).closest("article");
  expect(editableCard).not.toBeNull();
  expect(targetCard).not.toBeNull();

  fireEvent.doubleClick(editableCard as HTMLElement);
  fireEvent.click(
    within(targetCard as HTMLElement).getByRole("button", { name: "笔记操作" }),
  );
  fireEvent.click(
    within(targetCard as HTMLElement).getByRole("button", { name: "Mention" }),
  );

  expect((within(editableCard as HTMLElement).getByRole("textbox") as HTMLTextAreaElement).value)
    .toBe("editable content [[bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb]]");
  const noteEditors = screen.getAllByPlaceholderText("现在的想法是...");
  expect((noteEditors[noteEditors.length - 1] as HTMLTextAreaElement).value)
    .toBe("");
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
          role: "Human",
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

/** Verifies create submissions prefer inline fields before sidebar defaults. */
test("submits the first inline field when creating notes", async () => {
  renderHomePage();
  await waitFor(() => expect(useNotesStore.getState().fields.length).toBeGreaterThan(0));

  const createNote = vi.fn(async () => undefined);

  act(() => {
    useNotesStore.setState({
      createNote,
      fields: [
        { id: "field-selected", name: "selected-default", createdAt: 1 },
      ],
      selectedField: "field-selected",
    });
  });

  const composer = await screen.findByPlaceholderText("现在的想法是...");
  fireEvent.change(composer, {
    target: { value: "@alpha @beta field-driven note #topic" },
  });
  fireEvent.submit(composer.closest("form") as HTMLFormElement);

  await waitFor(() =>
    expect(createNote).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "@alpha @beta field-driven note #topic",
        field: "alpha",
        tags: ["topic"],
      }),
    ),
  );
});

/** Verifies create submissions keep the selected field when no inline field exists. */
test("uses the selected field when creating notes without inline fields", async () => {
  renderHomePage();
  await waitFor(() => expect(useNotesStore.getState().fields.length).toBeGreaterThan(0));

  const createNote = vi.fn(async () => undefined);

  act(() => {
    useNotesStore.setState({
      createNote,
      fields: [
        { id: "field-selected", name: "selected-default", createdAt: 1 },
      ],
      selectedField: "field-selected",
    });
  });

  const composer = await screen.findByPlaceholderText("现在的想法是...");
  fireEvent.change(composer, {
    target: { value: "field fallback note #topic" },
  });
  fireEvent.submit(composer.closest("form") as HTMLFormElement);

  await waitFor(() =>
    expect(createNote).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "field fallback note #topic",
        field: "selected-default",
        tags: ["topic"],
      }),
    ),
  );
});

/** Verifies create submissions fall back to inbox without inline or selected fields. */
test("uses inbox when creating notes without inline or selected fields", async () => {
  renderHomePage();
  await waitFor(() => expect(useNotesStore.getState().fields.length).toBeGreaterThan(0));

  const createNote = vi.fn(async () => undefined);

  act(() => {
    useNotesStore.setState({
      createNote,
      selectedField: undefined,
    });
  });

  const composer = await screen.findByPlaceholderText("现在的想法是...");
  fireEvent.change(composer, {
    target: { value: "default field note #topic" },
  });
  fireEvent.submit(composer.closest("form") as HTMLFormElement);

  await waitFor(() =>
    expect(createNote).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "default field note #topic",
        field: "inbox",
        tags: ["topic"],
      }),
    ),
  );
});

/** Verifies the Settings button opens and closes the Settings modal. */
test("opens and closes Settings modal from the home toolbar", async () => {
  renderHomePage();

  fireEvent.click(await screen.findByRole("button", { name: "设置" }));

  expect(await screen.findByRole("dialog", { name: "Supabase" })).not.toBeNull();

  fireEvent.click(screen.getAllByRole("button", { name: "关闭" })[0]);

  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Supabase" })).toBeNull(),
  );
});

/** Verifies manual synchronization runs from the home toolbar. */
test("runs manual sync from the home toolbar", async () => {
  const syncClient = createMockSyncClient();
  renderHomePage(syncClient);

  fireEvent.click(await screen.findByRole("button", { name: "同步" }));

  expect(await screen.findByText("已推送 2 条，已拉取 3 条")).not.toBeNull();
  expect(syncClient.runSync).toHaveBeenCalled();
});

/** Verifies manual synchronization errors are shown near the home toolbar. */
test("shows manual sync errors from the home toolbar", async () => {
  const syncClient = {
    ...createMockSyncClient(),
    runSync: vi.fn(async () => {
      throw new Error("Sync failed");
    }),
  };
  renderHomePage(syncClient);

  fireEvent.click(await screen.findByRole("button", { name: "同步" }));

  expect(await screen.findByText("Sync failed")).not.toBeNull();
});

/** Finds the count text rendered inside a sidebar navigation row. */
async function sidebarNavCount(label: string, index = 0): Promise<string> {
  const row = await waitFor(() => {
    const matchingButtons = screen
      .getAllByText(label)
      .map((item) => item.closest("button"))
      .filter((item): item is HTMLButtonElement => item !== null);
    expect(matchingButtons[index]).not.toBeUndefined();
    return matchingButtons[index];
  });

  return row?.querySelector("span:last-child")?.textContent ?? "";
}

/** Finds the sidebar button whose visible label text matches exactly. */
function sidebarButtonForText(label: string): HTMLButtonElement {
  const button = screen
    .getAllByText(label)
    .map((item) => item.closest("button"))
    .find((item): item is HTMLButtonElement => item !== null);

  if (!button) {
    throw new Error(`Missing sidebar button for ${label}`);
  }

  return button;
}

/** Creates a mock sync client for home toolbar interaction tests. */
function createMockSyncClient(): SyncClient {
  return {
    getConfig: vi.fn(async () => ({
      enabled: true,
      intervalSeconds: 120,
      serviceRoleKeyConfigured: true,
      supabaseUrl: "https://project.supabase.co",
    })),
    getStatus: vi.fn(async () => ({
      enabled: true,
      states: [],
    })),
    runSync: vi.fn(async () => ({
      pulled: 3,
      pushed: 2,
    })),
    testConfig: vi.fn(async () => ({
      message: "connected",
      ok: true,
    })),
    updateConfig: vi.fn(async (input) => ({
      enabled: input.enabled,
      intervalSeconds: input.intervalSeconds,
      serviceRoleKeyConfigured: true,
      supabaseUrl: input.supabaseUrl,
    })),
  };
}

/** Renders HomePage with the providers required by its header controls. */
function renderHomePage(syncClient = createMockSyncClient()) {
  const rootRoute = createRootRoute();
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <HomePage syncClient={syncClient} />,
  });
  const router = createRouter({ routeTree: rootRoute.addChildren([homeRoute]) });

  render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
  );
}

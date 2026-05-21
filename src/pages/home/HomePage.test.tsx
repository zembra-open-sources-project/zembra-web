import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { i18next } from "../../i18n";
import { useNotesStore } from "../../features/notes/noteStore";
import { ThemeProvider } from "../../app/ThemeProvider";
import { HomePage } from "./HomePage";

afterEach(() => {
  useNotesStore.setState({
    fields: [],
    keyword: "",
    notes: [],
    selectedField: undefined,
    selectedTag: undefined,
    tags: [],
  });
  void i18next.changeLanguage("zh-CN");
});

/** Verifies that inline note editing parses the first field and locks other cards. */
test("edits one note inline and warns when multiple fields are present", async () => {
  render(
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>,
  );

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

import { Search, SendHorizontal, Tag } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNotesStore } from "../../features/notes/noteStore";

/** Renders the initial card note workspace. */
export function HomePage() {
  const [draft, setDraft] = useState("");
  const {
    notes,
    keyword,
    selectedTag,
    setKeyword,
    setSelectedTag,
    loadNotes,
    createNote,
  } = useNotesStore();

  const tags = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.tags))).sort(),
    [notes],
  );

  useEffect(() => {
    void loadNotes();
  }, [keyword, selectedTag, loadNotes]);

  /** Handles note creation from the composer form. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();

    if (!content) {
      return;
    }

    const parsedTags = Array.from(
      new Set(
        content
          .match(/#[\p{L}\p{N}_-]+/gu)
          ?.map((tag) => tag.slice(1)) ?? [],
      ),
    );

    await createNote({ content, tags: parsedTags });
    setDraft("");
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-zinc-900">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-0 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-zinc-200 bg-white/70 px-5 py-5 lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Zembra
            </p>
            <h1 className="mt-2 text-2xl font-semibold">卡片笔记</h1>
          </div>

          <label className="flex h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm">
            <Search className="size-4 text-zinc-500" aria-hidden="true" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-400"
              placeholder="搜索笔记"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-700">
              <Tag className="size-4" aria-hidden="true" />
              标签
            </div>
            <div className="flex flex-wrap gap-2 lg:flex-col">
              <button
                className="rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100"
                type="button"
                onClick={() => setSelectedTag(undefined)}
              >
                全部
              </button>
              {tags.map((tag) => (
                <button
                  className="rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100"
                  data-active={selectedTag === tag}
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="px-4 py-5 sm:px-8">
          <form
            className="mb-6 rounded-lg border border-zinc-200 bg-white shadow-sm"
            onSubmit={handleSubmit}
          >
            <textarea
              className="min-h-32 w-full resize-y rounded-t-lg bg-transparent p-4 text-base leading-7 outline-none placeholder:text-zinc-400"
              placeholder="记录一个想法，使用 #标签 快速归类"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
              <span className="text-sm text-zinc-500">轻 Markdown 文本</span>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-700"
                type="submit"
              >
                <SendHorizontal className="size-4" aria-hidden="true" />
                保存
              </button>
            </div>
          </form>

          <div className="grid gap-4">
            {notes.map((note) => (
              <article
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
                key={note.id}
              >
                <p className="whitespace-pre-wrap text-base leading-7">
                  {note.content}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <span
                      className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
                      key={tag}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

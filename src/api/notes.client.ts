import type { CreateNoteInput, NoteDto, NotesQuery } from "./types";

/** Defines the frontend note data access boundary. */
export interface NotesClient {
  /** Lists notes using the provided query filters. */
  listNotes(query: NotesQuery): Promise<NoteDto[]>;
  /** Creates a note using the provided input. */
  createNote(input: CreateNoteInput): Promise<NoteDto>;
}

/** Creates the initial mock notes client used before the backend API is connected. */
export function createMockNotesClient(): NotesClient {
  const now = Math.floor(Date.now() / 1000);
  const notes: NoteDto[] = [
    {
      id: "demo-note-1",
      content: "今天先把卡片笔记的输入、标签筛选和轻量部署路径搭起来。",
      createdAt: now - 7200,
      updatedAt: now - 3600,
      tags: ["产品", "初始化"],
    },
    {
      id: "demo-note-2",
      content: "数据库契约来自 vendor/zembra-schema，前端只通过 API Client 消费业务数据。",
      createdAt: now - 5400,
      updatedAt: now - 1800,
      tags: ["架构", "schema"],
    },
  ];

  return {
    async listNotes(query) {
      return notes.filter((note) => {
        const keywordMatched =
          !query.keyword || note.content.includes(query.keyword);
        const tagMatched = !query.tag || note.tags.includes(query.tag);
        return keywordMatched && tagMatched;
      });
    },
    async createNote(input) {
      const timestamp = Math.floor(Date.now() / 1000);
      const note: NoteDto = {
        id: `demo-note-${timestamp}`,
        content: input.content,
        createdAt: timestamp,
        updatedAt: timestamp,
        tags: input.tags ?? [],
      };

      notes.unshift(note);
      return note;
    },
  };
}

import { requestJson } from "./http";
import type {
  CreateNoteInput,
  ListNoteTagsResponse,
  ListNotesResponse,
  NoteDto,
  NoteRecord,
  NoteResponse,
  NotesQuery,
  RecentNotesQuery,
  UpdateNoteInput,
} from "./types";

/** Defines the frontend note data access boundary. */
export interface NotesClient {
  /** Lists recent notes ordered by update time for the home feed. */
  listRecentNotes(query?: RecentNotesQuery): Promise<NoteDto[]>;
  /** Lists notes using the provided query filters. */
  listNotes(query: NotesQuery): Promise<NoteDto[]>;
  /** Reads a single note by full ID or unique prefix. */
  getNote(noteRef: string): Promise<NoteDto>;
  /** Creates a note using the provided input. */
  createNote(input: CreateNoteInput): Promise<NoteDto>;
  /** Updates a note by full ID or unique prefix. */
  updateNote(noteRef: string, input: UpdateNoteInput): Promise<NoteDto>;
  /** Soft deletes a note by full ID or unique prefix. */
  deleteNote(noteRef: string): Promise<void>;
}

/** Defines configuration for the HTTP notes client. */
export interface NotesHttpClientOptions {
  /** Base URL for the Zembra backend API. */
  baseUrl: string;
}

/** Creates a notes client backed by the Zembra OpenAPI HTTP server. */
export function createNotesHttpClient(
  options: NotesHttpClientOptions,
): NotesClient {
  const { baseUrl } = options;

  return {
    async listRecentNotes(query = {}) {
      const response = await requestJson<ListNotesResponse>(
        baseUrl,
        "/notes/recent",
        {
          method: "POST",
          body: {
            limit: query.limit ?? 50,
            note_uuid: query.noteUuid,
          },
        },
      );
      const notes = await Promise.all(
        response.notes.map(async (note) =>
          mapNoteRecordToDto(note, await listTagNames(baseUrl, note.id)),
        ),
      );

      return notes;
    },
    async listNotes(query) {
      const response = await requestJson<ListNotesResponse>(baseUrl, "/notes", {
        query: { limit: undefined },
      });
      const notes = await Promise.all(
        response.notes.map(async (note) =>
          mapNoteRecordToDto(note, await listTagNames(baseUrl, note.id)),
        ),
      );

      return filterNotes(notes, query);
    },
    async getNote(noteRef) {
      const note = await requestJson<NoteRecord>(
        baseUrl,
        `/notes/${encodeURIComponent(noteRef)}`,
      );
      return mapNoteRecordToDto(note, await listTagNames(baseUrl, note.id));
    },
    async createNote(input) {
      const response = await requestJson<NoteResponse>(baseUrl, "/notes", {
        method: "POST",
        body: {
          content: input.content,
          device_id: input.deviceId,
          field: input.field,
          role: input.role ?? "user",
          tags: input.tags ?? [],
        },
      });

      return mapNoteResponseToDto(response);
    },
    async updateNote(noteRef, input) {
      const note = await requestJson<NoteRecord>(
        baseUrl,
        `/notes/${encodeURIComponent(noteRef)}`,
        {
          method: "PATCH",
          body: {
            content: input.content,
            device_id: input.deviceId,
          },
        },
      );

      return mapNoteRecordToDto(note, await listTagNames(baseUrl, note.id));
    },
    async deleteNote(noteRef) {
      await requestJson<void>(baseUrl, `/notes/${encodeURIComponent(noteRef)}`, {
        method: "DELETE",
      });
    },
  };
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
    async listRecentNotes(query = {}) {
      return filterNotes(notes.slice(0, query.limit ?? 50), {});
    },
    async listNotes(query) {
      return notes.filter((note) => {
        const keywordMatched =
          !query.keyword || note.content.includes(query.keyword);
        const tagMatched = !query.tag || note.tags.includes(query.tag);
        return keywordMatched && tagMatched;
      });
    },
    async getNote(noteRef) {
      const note = notes.find((item) => item.id.startsWith(noteRef));

      if (!note) {
        throw new Error(`Note not found: ${noteRef}`);
      }

      return note;
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
    async updateNote(noteRef, input) {
      const note = notes.find((item) => item.id.startsWith(noteRef));

      if (!note) {
        throw new Error(`Note not found: ${noteRef}`);
      }

      note.content = input.content;
      note.updatedAt = Math.floor(Date.now() / 1000);
      return note;
    },
    async deleteNote(noteRef) {
      const index = notes.findIndex((item) => item.id.startsWith(noteRef));

      if (index >= 0) {
        notes.splice(index, 1);
      }
    },
  };
}

/** Maps a backend note response wrapper to the frontend note DTO. */
export function mapNoteResponseToDto(response: NoteResponse): NoteDto {
  return mapNoteRecordToDto(response.note, response.metadata.tags);
}

/** Maps a backend note record and resolved tag names to the frontend note DTO. */
export function mapNoteRecordToDto(note: NoteRecord, tags: string[] = []): NoteDto {
  return {
    id: note.id,
    content: note.content,
    fieldId: note.field_id ?? undefined,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
    tags,
  };
}

/** Loads tag names for a note from the backend. */
async function listTagNames(baseUrl: string, noteRef: string): Promise<string[]> {
  const response = await requestJson<ListNoteTagsResponse>(
    baseUrl,
    `/notes/${encodeURIComponent(noteRef)}/tags`,
  );

  return response.tags.map((tag) => tag.name);
}

/** Applies UI-level keyword and tag filters to note DTOs. */
function filterNotes(notes: NoteDto[], query: NotesQuery): NoteDto[] {
  return notes.filter((note) => {
    const keywordMatched =
      !query.keyword || note.content.includes(query.keyword);
    const tagMatched = !query.tag || note.tags.includes(query.tag);
    const fieldMatched = !query.fieldId || note.fieldId === query.fieldId;
    return keywordMatched && tagMatched && fieldMatched;
  });
}

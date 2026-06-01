import {
  resolveBackendBaseUrl,
  type BackendBaseUrlSource,
} from "./backendConfig";
import { requestJson } from "./http";
import type {
  CreateNoteInput,
  DailyNoteCount,
  DailyNoteCountsResponse,
  ListNoteTagsResponse,
  ListNotesResponse,
  NoteDto,
  NoteLinkInput,
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
  /** Lists visible note counts for the past 30 server-local calendar days. */
  listDailyNoteCounts(): Promise<DailyNoteCount[]>;
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
  baseUrl: BackendBaseUrlSource;
}

/** Creates a notes client backed by the Zembra OpenAPI HTTP server. */
export function createNotesHttpClient(
  options: NotesHttpClientOptions,
): NotesClient {
  const { baseUrl } = options;

  return {
    async listRecentNotes(query = {}) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const response = await requestJson<ListNotesResponse>(
        resolvedBaseUrl,
        "/notes/recent",
        {
          method: "POST",
          body: {
            limit: query.limit ?? 50,
            note_uuid: query.noteUuid,
            role: query.role,
          },
        },
      );
      const notes = await Promise.all(
        response.notes.map(async (note) =>
          mapNoteRecordToDto(note, await listTagNames(resolvedBaseUrl, note.id)),
        ),
      );

      return notes;
    },
    async listDailyNoteCounts() {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const response = await requestJson<DailyNoteCountsResponse>(
        resolvedBaseUrl,
        "/notes/stats/daily-counts",
      );

      return response.days;
    },
    async listNotes(query) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const response = await requestJson<ListNotesResponse>(
        resolvedBaseUrl,
        "/notes",
        {
          query: { limit: undefined },
        },
      );
      const notes = await Promise.all(
        response.notes.map(async (note) =>
          mapNoteRecordToDto(note, await listTagNames(resolvedBaseUrl, note.id)),
        ),
      );

      return filterNotes(notes, query);
    },
    async getNote(noteRef) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const response = await requestJson<NoteResponse>(
        resolvedBaseUrl,
        `/notes/${encodeURIComponent(noteRef)}`,
      );
      return mapNoteResponseToDto(response);
    },
    async createNote(input) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const response = await requestJson<NoteResponse>(
        resolvedBaseUrl,
        "/notes",
        {
          method: "POST",
          body: {
            content: input.content,
            device_id: input.deviceId,
            field: input.field,
            links: mapNoteLinksToRequest(input.links ?? []),
            role: input.role ?? "Human",
            tags: input.tags ?? [],
          },
        },
      );

      return mapNoteResponseToDto(response);
    },
    async updateNote(noteRef, input) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const response = await requestJson<NoteResponse>(
        resolvedBaseUrl,
        `/notes/${encodeURIComponent(noteRef)}`,
        {
          method: "PATCH",
          body: {
            content: input.content,
            device_id: input.deviceId,
            field: input.field,
            links: input.links
              ? mapNoteLinksToRequest(input.links)
              : input.links,
            tags: input.tags,
          },
        },
      );

      return mapNoteResponseToDto(response);
    },
    async deleteNote(noteRef) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      await requestJson<void>(
        resolvedBaseUrl,
        `/notes/${encodeURIComponent(noteRef)}`,
        {
          method: "DELETE",
        },
      );
    },
  };
}

/** Maps frontend link inputs to the backend request field names. */
function mapNoteLinksToRequest(links: NoteLinkInput[]) {
  return links.map((link) => ({
    anchor_text: link.anchorText,
    position: link.position,
    target_note_ref: link.targetNoteRef,
  }));
}

/** Creates the initial mock notes client used before the backend API is connected. */
export function createMockNotesClient(): NotesClient {
  const now = Math.floor(Date.now() / 1000);
  const notes: NoteDto[] = [
    {
      id: "demo-note-1",
      content: "今天先把卡片笔记的输入、标签筛选和轻量部署路径搭起来。",
      role: "Human",
      createdAt: now - 7200,
      updatedAt: now - 3600,
      tags: ["产品", "初始化"],
    },
    {
      id: "demo-note-2",
      content: "数据库契约来自 vendor/zembra-schema，前端只通过 API Client 消费业务数据。",
      role: "Agent",
      createdAt: now - 5400,
      updatedAt: now - 1800,
      tags: ["架构", "schema"],
    },
  ];

  return {
    async listRecentNotes(query = {}) {
      const roleMatchedNotes = notes.filter((note) =>
        query.role === undefined ? true : note.role === query.role,
      );
      return filterNotes(roleMatchedNotes.slice(0, query.limit ?? 50), {});
    },
    async listDailyNoteCounts() {
      return createMockDailyNoteCounts(now);
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
        role: input.role ?? "Human",
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
      note.tags = input.tags ?? note.tags;
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

/** Creates deterministic mock daily counts for test and local mock mode. */
function createMockDailyNoteCounts(now: number): DailyNoteCount[] {
  const today = new Date(now * 1000);

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    const dateKey = date.toISOString().slice(0, 10);

    return {
      count: index % 9 === 0 ? 3 : index % 5 === 0 ? 1 : 0,
      date: dateKey,
    };
  });
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
    role: note.role,
    fieldId: note.field_id ?? undefined,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
    tags,
  };
}

/** Loads tag paths for a note from the backend. */
async function listTagNames(baseUrl: string, noteRef: string): Promise<string[]> {
  const response = await requestJson<ListNoteTagsResponse>(
    baseUrl,
    `/notes/${encodeURIComponent(noteRef)}/tags`,
  );

  return response.tags.map((tag) => tag.path);
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

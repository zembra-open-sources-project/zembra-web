import { afterEach, describe, expect, test, vi } from "vitest";
import { ApiError } from "./http";
import { createNotesHttpClient, mapNoteResponseToDto } from "./notes.client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

/** Creates a successful JSON fetch response for client tests. */
function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createNotesHttpClient", () => {
  test("lists recent notes with the recent notes endpoint", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/notes/recent")) {
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({ limit: 50 });

        return jsonResponse({
          notes: [
            {
              id: "recent-1",
              content: "recent note",
              role: "Human",
              field_id: "field-1",
              created_at: 1,
              updated_at: 2,
            },
          ],
        });
      }

      return jsonResponse({
        tags: [{ id: "tag-1", name: "recent", created_at: 1 }],
      });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createNotesHttpClient({ baseUrl: "http://server.test" });

    await expect(client.listRecentNotes()).resolves.toEqual([
      {
        id: "recent-1",
        content: "recent note",
        role: "Human",
        fieldId: "field-1",
        createdAt: 1,
        updatedAt: 2,
        tags: ["recent"],
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("lists recent notes with a role filter", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/notes/recent")) {
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({
          limit: 50,
          role: "Agent",
        });

        return jsonResponse({
          notes: [
            {
              id: "agent-note",
              content: "agent note",
              role: "Agent",
              field_id: null,
              created_at: 1,
              updated_at: 2,
            },
          ],
        });
      }

      return jsonResponse({ tags: [] });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createNotesHttpClient({ baseUrl: "http://server.test" });

    await expect(client.listRecentNotes({ role: "Agent" })).resolves.toEqual([
      {
        id: "agent-note",
        content: "agent note",
        role: "Agent",
        createdAt: 1,
        updatedAt: 2,
        tags: [],
      },
    ]);
  });

  test("lists daily note counts with the stats endpoint", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://server.test/notes/stats/daily-counts");
      expect(init?.method).toBe("GET");

      return jsonResponse({
        days: [
          { date: "2026-05-20", count: 2 },
          { date: "2026-05-21", count: 0 },
        ],
      });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createNotesHttpClient({ baseUrl: "http://server.test" });

    await expect(client.listDailyNoteCounts()).resolves.toEqual([
      { date: "2026-05-20", count: 2 },
      { date: "2026-05-21", count: 0 },
    ]);
  });

  test("lists notes using backend records and note tag endpoints", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/notes")) {
        return jsonResponse({
          notes: [
            {
              id: "abc123",
              content: "hello #work",
              role: "Human",
              field_id: "field-1",
              created_at: 1,
              updated_at: 2,
            },
          ],
        });
      }

      return jsonResponse({
        tags: [{ id: "tag-1", name: "work", created_at: 1 }],
      });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createNotesHttpClient({ baseUrl: "http://server.test" });

    await expect(client.listNotes({ tag: "work" })).resolves.toEqual([
      {
        id: "abc123",
        content: "hello #work",
        role: "Human",
        fieldId: "field-1",
        createdAt: 1,
        updatedAt: 2,
        tags: ["work"],
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("creates notes with the OpenAPI request body shape", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        content: "new note",
        field: undefined,
        links: [],
        role: "Human",
        tags: ["api"],
      });

      return jsonResponse(
        {
          note: {
            id: "note-1",
            content: "new note",
            role: "user",
            field_id: null,
            created_at: 10,
            updated_at: 10,
          },
          metadata: { tags: ["api"], role: "user", field: null },
        },
        { status: 201 },
      );
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createNotesHttpClient({ baseUrl: "http://server.test" });

    await expect(
      client.createNote({ content: "new note", tags: ["api"] }),
    ).resolves.toMatchObject({
      id: "note-1",
      tags: ["api"],
    });
  });

  test("creates notes with parsed note links", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toMatchObject({
        links: [
          {
            anchor_text: "[[abcdef1234567890abcdef1234567890]]",
            position: 4,
            target_note_ref: "abcdef1234567890abcdef1234567890",
          },
        ],
      });

      return jsonResponse(
        {
          note: {
            id: "note-1",
            content: "new note",
            role: "Human",
            field_id: null,
            created_at: 10,
            updated_at: 10,
          },
          metadata: {
            backlinks: [],
            field: null,
            outgoing_links: [],
            role: "Human",
            tags: [],
          },
        },
        { status: 201 },
      );
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createNotesHttpClient({ baseUrl: "http://server.test" });

    await expect(
      client.createNote({
        content: "new note",
        links: [
          {
            anchorText: "[[abcdef1234567890abcdef1234567890]]",
            position: 4,
            targetNoteRef: "abcdef1234567890abcdef1234567890",
          },
        ],
      }),
    ).resolves.toMatchObject({ id: "note-1" });
  });

  test("throws ApiError for backend error responses", async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: "validation_error",
            message: "content is required",
            details: {},
          },
        },
        { status: 422 },
      ),
    ) as typeof fetch;

    const client = createNotesHttpClient({ baseUrl: "http://server.test" });

    await expect(client.createNote({ content: "" })).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      code: "validation_error",
    } satisfies Partial<ApiError>);
  });

  test("updates notes with replacement field and tags", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/notes/abc123")) {
        expect(init?.method).toBe("PATCH");
        expect(JSON.parse(String(init?.body))).toEqual({
          content: "edited note",
          device_id: "device-1",
          field: "project",
          links: [
            {
              anchor_text: "[[abcdef1234567890abcdef1234567890]]",
              position: 12,
              target_note_ref: "abcdef1234567890abcdef1234567890",
            },
          ],
          tags: ["api", "edit"],
        });

        return jsonResponse({
          note: {
            id: "abc123",
            content: "edited note",
            role: "Human",
            field_id: "field-project",
            created_at: 1,
            updated_at: 3,
          },
          metadata: {
            backlinks: [],
            field: "project",
            outgoing_links: [],
            role: "Human",
            tags: ["api", "edit"],
          },
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createNotesHttpClient({ baseUrl: "http://server.test" });

    await expect(
      client.updateNote("abc123", {
        content: "edited note",
        deviceId: "device-1",
        field: "project",
        links: [
          {
            anchorText: "[[abcdef1234567890abcdef1234567890]]",
            position: 12,
            targetNoteRef: "abcdef1234567890abcdef1234567890",
          },
        ],
        tags: ["api", "edit"],
      }),
    ).resolves.toEqual({
      id: "abc123",
      content: "edited note",
      role: "Human",
      fieldId: "field-project",
      createdAt: 1,
      updatedAt: 3,
      tags: ["api", "edit"],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("reads a single note from the OpenAPI note response shape", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        note: {
          id: "abc123",
          content: "preview note",
          role: "Human",
          field_id: null,
          created_at: 1,
          updated_at: 2,
        },
        metadata: {
          backlinks: [],
          field: null,
          outgoing_links: [],
          role: "Human",
          tags: ["preview"],
        },
      }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createNotesHttpClient({ baseUrl: "http://server.test" });

    await expect(client.getNote("abc123")).resolves.toEqual({
      id: "abc123",
      content: "preview note",
      role: "Human",
      createdAt: 1,
      updatedAt: 2,
      tags: ["preview"],
    });
  });
});

describe("mapNoteResponseToDto", () => {
  test("maps backend snake_case fields to frontend camelCase fields", () => {
    expect(
      mapNoteResponseToDto({
        note: {
          id: "note-1",
          content: "content",
          role: "Human",
          field_id: "field-1",
          created_at: 1,
          updated_at: 2,
        },
        metadata: {
          backlinks: [],
          field: "field",
          outgoing_links: [],
          role: "Human",
          tags: ["tag"],
        },
      }),
    ).toEqual({
      id: "note-1",
      content: "content",
      role: "Human",
      fieldId: "field-1",
      createdAt: 1,
      updatedAt: 2,
      tags: ["tag"],
    });
  });

  test("deletes notes with the OpenAPI delete endpoint", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createNotesHttpClient({ baseUrl: "http://server.test" });

    await expect(client.deleteNote("abc123")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://server.test/notes/abc123"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

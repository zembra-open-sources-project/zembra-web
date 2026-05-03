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
        fieldId: "field-1",
        createdAt: 1,
        updatedAt: 2,
        tags: ["recent"],
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
        role: "user",
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
        metadata: { tags: ["tag"], role: "Human", field: "field" },
      }),
    ).toEqual({
      id: "note-1",
      content: "content",
      fieldId: "field-1",
      createdAt: 1,
      updatedAt: 2,
      tags: ["tag"],
    });
  });
});

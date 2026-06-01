import { afterEach, describe, expect, test, vi } from "vitest";
import {
  createTaxonomyHttpClient,
  mapFieldRecordToDto,
  mapTagRecordToDto,
} from "./taxonomy.client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

/** Creates a successful JSON fetch response for taxonomy client tests. */
function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createTaxonomyHttpClient", () => {
  test("lists all fields from the OpenAPI fields endpoint", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      jsonResponse({
        fields: [
          { id: "field-1", name: "inbox", created_at: 10 },
          { id: "field-2", name: "project", created_at: 20 },
        ],
        names: ["inbox", "project"],
      }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createTaxonomyHttpClient({ baseUrl: "http://server.test" });

    await expect(client.listFields()).resolves.toEqual([
      { id: "field-1", name: "inbox", createdAt: 10 },
      { id: "field-2", name: "project", createdAt: 20 },
    ]);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "http://server.test/fields?all=true",
    );
  });

  test("lists all tags from the OpenAPI tags endpoint", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      jsonResponse({
        tags: [
          {
            id: "tag-1",
            name: "Agents",
            parent_tag_id: null,
            path: "Agents",
            depth: 0,
            created_at: 10,
          },
          {
            id: "tag-2",
            name: "hermes",
            parent_tag_id: "tag-1",
            path: "Agents/hermes",
            depth: 1,
            created_at: 20,
          },
        ],
        names: ["Agents", "Agents/hermes"],
      }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const client = createTaxonomyHttpClient({ baseUrl: "http://server.test" });

    await expect(client.listTags()).resolves.toEqual([
      {
        id: "tag-1",
        name: "Agents",
        path: "Agents",
        depth: 0,
        createdAt: 10,
      },
      {
        id: "tag-2",
        name: "hermes",
        parentTagId: "tag-1",
        path: "Agents/hermes",
        depth: 1,
        createdAt: 20,
      },
    ]);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "http://server.test/tags?all=true",
    );
  });
});

describe("mapFieldRecordToDto", () => {
  test("maps backend snake_case field records to frontend field DTOs", () => {
    expect(
      mapFieldRecordToDto({
        id: "field-1",
        name: "inbox",
        created_at: 10,
      }),
    ).toEqual({
      id: "field-1",
      name: "inbox",
      createdAt: 10,
    });
  });
});

describe("mapTagRecordToDto", () => {
  test("maps backend snake_case tag records to frontend tag DTOs", () => {
    expect(
      mapTagRecordToDto({
        id: "tag-1",
        name: "Agents",
        parent_tag_id: null,
        path: "Agents",
        depth: 0,
        created_at: 10,
      }),
    ).toEqual({
      id: "tag-1",
      name: "Agents",
      path: "Agents",
      depth: 0,
      createdAt: 10,
    });
  });

  test("maps child tag records with parent and path fields", () => {
    expect(
      mapTagRecordToDto({
        id: "tag-2",
        name: "hermes",
        parent_tag_id: "tag-1",
        path: "Agents/hermes",
        depth: 1,
        created_at: 20,
      }),
    ).toEqual({
      id: "tag-2",
      name: "hermes",
      parentTagId: "tag-1",
      path: "Agents/hermes",
      depth: 1,
      createdAt: 20,
    });
  });
});

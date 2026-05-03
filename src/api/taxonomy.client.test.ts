import { afterEach, describe, expect, test, vi } from "vitest";
import {
  createTaxonomyHttpClient,
  mapFieldRecordToDto,
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
  test("lists fields from the OpenAPI fields endpoint", async () => {
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
      "http://server.test/fields",
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

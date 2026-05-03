import { requestJson } from "./http";
import type { FieldDto, FieldRecord, ListFieldsResponse } from "./types";

/** Defines the frontend taxonomy data access boundary. */
export interface TaxonomyClient {
  /** Lists fields available for note organization. */
  listFields(): Promise<FieldDto[]>;
}

/** Defines configuration for the HTTP taxonomy client. */
export interface TaxonomyHttpClientOptions {
  /** Base URL for the Zembra backend API. */
  baseUrl: string;
}

/** Creates a taxonomy client backed by the Zembra OpenAPI HTTP server. */
export function createTaxonomyHttpClient(
  options: TaxonomyHttpClientOptions,
): TaxonomyClient {
  const { baseUrl } = options;

  return {
    async listFields() {
      const response = await requestJson<ListFieldsResponse>(baseUrl, "/fields");
      return response.fields.map(mapFieldRecordToDto);
    },
  };
}

/** Creates a mock taxonomy client used by tests before backend access is needed. */
export function createMockTaxonomyClient(): TaxonomyClient {
  return {
    async listFields() {
      return [
        { id: "mock-field-inbox", name: "inbox", createdAt: 1 },
        { id: "mock-field-projects", name: "projects", createdAt: 2 },
      ];
    },
  };
}

/** Maps a backend field record to the frontend field DTO. */
export function mapFieldRecordToDto(field: FieldRecord): FieldDto {
  return {
    id: field.id,
    name: field.name,
    createdAt: field.created_at,
  };
}

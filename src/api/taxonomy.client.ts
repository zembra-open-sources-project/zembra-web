import { requestJson } from "./http";
import type {
  FieldDto,
  FieldRecord,
  ListFieldsResponse,
  ListTagsResponse,
  TagDto,
  TagRecord,
} from "./types";

/** Defines the frontend taxonomy data access boundary. */
export interface TaxonomyClient {
  /** Lists fields available for note organization. */
  listFields(): Promise<FieldDto[]>;
  /** Lists tags available for note organization. */
  listTags(): Promise<TagDto[]>;
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
      const response = await requestJson<ListFieldsResponse>(baseUrl, "/fields", {
        query: { all: true },
      });
      return response.fields.map(mapFieldRecordToDto);
    },
    async listTags() {
      const response = await requestJson<ListTagsResponse>(baseUrl, "/tags", {
        query: { all: true },
      });
      return response.tags.map(mapTagRecordToDto);
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
    async listTags() {
      return [
        { id: "mock-tag-product", name: "产品", createdAt: 1 },
        { id: "mock-tag-architecture", name: "架构", createdAt: 2 },
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

/** Maps a backend tag record to the frontend tag DTO. */
export function mapTagRecordToDto(tag: TagRecord): TagDto {
  return {
    id: tag.id,
    name: tag.name,
    createdAt: tag.created_at,
  };
}

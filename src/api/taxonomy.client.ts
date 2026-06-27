import {
  resolveBackendBaseUrl,
  type BackendBaseUrlSource,
} from "./backendConfig";
import { requestJson } from "./http";
import type {
  DeleteFieldRequest,
  DeleteFieldResponse,
  FieldDto,
  FieldRecord,
  ListFieldsResponse,
  ListTagsResponse,
  TagDto,
  TagRecord,
} from "./types";

/** Defines a workspace ID value or lazy resolver. */
type WorkspaceIdSource = string | (() => string | Promise<string>);

/** Defines the frontend taxonomy data access boundary. */
export interface TaxonomyClient {
  /** Lists fields available for note organization. */
  listFields(): Promise<FieldDto[]>;
  /** Lists tags available for note organization. */
  listTags(): Promise<TagDto[]>;
  /** Deletes an unused field by stable identifier. */
  deleteField(fieldId: string): Promise<void>;
}

/** Defines configuration for the HTTP taxonomy client. */
export interface TaxonomyHttpClientOptions {
  /** Base URL for the Zembra backend API. */
  baseUrl: BackendBaseUrlSource;
  /** Workspace UUID sent as the required field deletion request scope. */
  workspaceId?: WorkspaceIdSource;
}

/** Creates a taxonomy client backed by the Zembra OpenAPI HTTP server. */
export function createTaxonomyHttpClient(
  options: TaxonomyHttpClientOptions,
): TaxonomyClient {
  const { baseUrl, workspaceId } = options;

  return {
    async listFields() {
      const response = await requestJson<ListFieldsResponse>(
        resolveBackendBaseUrl(baseUrl),
        "/fields",
        {
          query: { all: true },
        },
      );
      return response.fields.map(mapFieldRecordToDto);
    },
    async listTags() {
      const response = await requestJson<ListTagsResponse>(
        resolveBackendBaseUrl(baseUrl),
        "/tags",
        {
          query: { all: true },
        },
      );
      return response.tags.map(mapTagRecordToDto);
    },
    async deleteField(fieldId) {
      await requestJson<DeleteFieldResponse>(
        resolveBackendBaseUrl(baseUrl),
        "/fields/delete",
        {
          method: "POST",
          body: {
            field_id: fieldId,
            workspace_id: await resolveWorkspaceId(workspaceId),
          } satisfies DeleteFieldRequest,
        },
      );
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
        {
          id: "mock-tag-product",
          name: "产品",
          path: "产品",
          depth: 0,
          createdAt: 1,
        },
        {
          id: "mock-tag-architecture",
          name: "架构",
          path: "架构",
          depth: 0,
          createdAt: 2,
        },
      ];
    },
    async deleteField() {
      return undefined;
    },
  };
}

/** Resolves a configured workspace source into a concrete workspace UUID. */
async function resolveWorkspaceId(source?: WorkspaceIdSource): Promise<string> {
  if (!source) {
    throw new Error("No workspace available for field API requests");
  }

  return typeof source === "function" ? await source() : source;
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
    parentTagId: tag.parent_tag_id ?? undefined,
    path: tag.path,
    depth: tag.depth,
    createdAt: tag.created_at,
  };
}

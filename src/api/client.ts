import {
  defaultBackendBaseUrl,
  defaultWorkspaceId,
  getEffectiveBackendBaseUrl,
} from "./backendConfig";
import {
  createMockNotesClient,
  createNotesHttpClient,
  type NotesClient,
} from "./notes.client";
import {
  createMockTaxonomyClient,
  createTaxonomyHttpClient,
  type TaxonomyClient,
} from "./taxonomy.client";
import {
  createMockSyncClient,
  createSyncHttpClient,
  type SyncClient,
} from "./sync.client";
import { requestJson } from "./http";
import type { ListWorkspacesResponse } from "./types";

/** Resolves the API base URL from saved user config or Vite defaults. */
const resolveDefaultApiBaseUrl = () =>
  getEffectiveBackendBaseUrl(defaultBackendBaseUrl);

let cachedDefaultWorkspaceId: string | undefined;

/** Resolves the default workspace scope used by note CRUD requests. */
async function resolveDefaultWorkspaceId(): Promise<string> {
  const configuredWorkspaceId = defaultWorkspaceId.trim();

  if (configuredWorkspaceId) {
    return configuredWorkspaceId;
  }

  if (cachedDefaultWorkspaceId) {
    return cachedDefaultWorkspaceId;
  }

  const response = await requestJson<ListWorkspacesResponse>(
    resolveDefaultApiBaseUrl(),
    "/workspaces",
  );
  const workspaceId = response.workspaces[0]?.workspace_id;

  if (!workspaceId) {
    throw new Error("No workspace available for note API requests");
  }

  cachedDefaultWorkspaceId = workspaceId;
  return workspaceId;
}

/** Creates the default notes client configured for the current Vite environment. */
export function createDefaultNotesClient(): NotesClient {
  if (import.meta.env.MODE === "test") {
    return createMockNotesClient();
  }

  return createNotesHttpClient({
    baseUrl: resolveDefaultApiBaseUrl,
    workspaceId: resolveDefaultWorkspaceId,
  });
}

/** Creates the default taxonomy client configured for the current Vite environment. */
export function createDefaultTaxonomyClient(): TaxonomyClient {
  if (import.meta.env.MODE === "test") {
    return createMockTaxonomyClient();
  }

  return createTaxonomyHttpClient({ baseUrl: resolveDefaultApiBaseUrl });
}

/** Creates the default sync client configured for the current Vite environment. */
export function createDefaultSyncClient(): SyncClient {
  if (import.meta.env.MODE === "test") {
    return createMockSyncClient();
  }

  return createSyncHttpClient({ baseUrl: resolveDefaultApiBaseUrl });
}

/** Default notes client shared by feature stores. */
export const notesClient = createDefaultNotesClient();

/** Default taxonomy client shared by feature stores. */
export const taxonomyClient = createDefaultTaxonomyClient();

/** Default sync client shared by settings pages. */
export const syncClient = createDefaultSyncClient();

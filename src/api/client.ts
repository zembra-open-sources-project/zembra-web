import {
  getEffectiveBackendBaseUrl,
  type BackendBaseUrlResolver,
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

const defaultApiBaseUrl =
  import.meta.env.VITE_ZEMBRA_API_BASE_URL ?? "http://127.0.0.1:3000";

/** Resolves the API base URL from saved user config or Vite defaults. */
const resolveDefaultApiBaseUrl: BackendBaseUrlResolver = () =>
  getEffectiveBackendBaseUrl(defaultApiBaseUrl);

/** Creates the default notes client configured for the current Vite environment. */
export function createDefaultNotesClient(): NotesClient {
  if (import.meta.env.MODE === "test") {
    return createMockNotesClient();
  }

  return createNotesHttpClient({ baseUrl: resolveDefaultApiBaseUrl });
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

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

const defaultApiBaseUrl =
  import.meta.env.VITE_ZEMBRA_API_BASE_URL ?? "/api";

/** Creates the default notes client configured for the current Vite environment. */
export function createDefaultNotesClient(): NotesClient {
  if (import.meta.env.MODE === "test") {
    return createMockNotesClient();
  }

  return createNotesHttpClient({ baseUrl: defaultApiBaseUrl });
}

/** Creates the default taxonomy client configured for the current Vite environment. */
export function createDefaultTaxonomyClient(): TaxonomyClient {
  if (import.meta.env.MODE === "test") {
    return createMockTaxonomyClient();
  }

  return createTaxonomyHttpClient({ baseUrl: defaultApiBaseUrl });
}

/** Default notes client shared by feature stores. */
export const notesClient = createDefaultNotesClient();

/** Default taxonomy client shared by feature stores. */
export const taxonomyClient = createDefaultTaxonomyClient();

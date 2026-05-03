import {
  createMockNotesClient,
  createNotesHttpClient,
  type NotesClient,
} from "./notes.client";

const defaultApiBaseUrl =
  import.meta.env.VITE_ZEMBRA_API_BASE_URL ?? "http://127.0.0.1:3000";

/** Creates the default notes client configured for the current Vite environment. */
export function createDefaultNotesClient(): NotesClient {
  if (import.meta.env.MODE === "test") {
    return createMockNotesClient();
  }

  return createNotesHttpClient({ baseUrl: defaultApiBaseUrl });
}

/** Default notes client shared by feature stores. */
export const notesClient = createDefaultNotesClient();

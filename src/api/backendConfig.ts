/** Local storage key used to persist the configured backend API base URL. */
export const backendBaseUrlStorageKey = "zembra.backendBaseUrl";

/** Function that resolves the current backend API base URL. */
export type BackendBaseUrlResolver = () => string;

/** Defines an API base URL value or lazy resolver. */
export type BackendBaseUrlSource = string | BackendBaseUrlResolver;

/** Reads the configured backend API base URL from browser storage. */
export function getConfiguredBackendBaseUrl(): string | undefined {
  const value = window.localStorage.getItem(backendBaseUrlStorageKey)?.trim();
  return value ? value : undefined;
}

/** Saves the configured backend API base URL to browser storage. */
export function setConfiguredBackendBaseUrl(baseUrl: string): void {
  window.localStorage.setItem(
    backendBaseUrlStorageKey,
    normalizeBackendBaseUrl(baseUrl),
  );
}

/** Removes the configured backend API base URL from browser storage. */
export function clearConfiguredBackendBaseUrl(): void {
  window.localStorage.removeItem(backendBaseUrlStorageKey);
}

/** Resolves a string or lazy base URL source into a concrete URL. */
export function resolveBackendBaseUrl(source: BackendBaseUrlSource): string {
  return typeof source === "function" ? source() : source;
}

/** Normalizes user-entered backend URLs before storage and fetch requests. */
export function normalizeBackendBaseUrl(value: string): string {
  const trimmed = value.trim();
  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;

  return withProtocol.endsWith("/") ? withProtocol.slice(0, -1) : withProtocol;
}

/** Checks whether the provided backend API base URL is reachable. */
export async function checkBackendReachability(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    const response = await fetch(normalizeBackendBaseUrl(baseUrl), {
      method: "GET",
      cache: "no-store",
      signal,
    });

    return response.status < 500;
  } catch {
    return false;
  }
}

/** Loads the configured backend URL or falls back to the Vite default. */
export function getEffectiveBackendBaseUrl(defaultBaseUrl: string): string {
  return getConfiguredBackendBaseUrl() ?? defaultBaseUrl;
}

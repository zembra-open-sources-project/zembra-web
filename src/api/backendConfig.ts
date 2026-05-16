/** Local storage key used to persist the configured backend API base URL. */
export const backendBaseUrlStorageKey = "zembra.backendBaseUrl";

/** Function that resolves the current backend API base URL. */
export type BackendBaseUrlResolver = () => string;

/** Defines an API base URL value or lazy resolver. */
export type BackendBaseUrlSource = string | BackendBaseUrlResolver;

/** Default backend service root confirmed by the backend OpenAPI docs. */
export const defaultBackendBaseUrl =
  import.meta.env.VITE_ZEMBRA_API_BASE_URL ?? "http://127.0.0.1:3000";

/** Splits a backend service root URL into user-editable host and port fields. */
export function parseBackendEndpoint(value: string): {
  /** Hostname or IP address used by the backend service. */
  host: string;
  /** Optional TCP port used by the backend service. */
  port: string;
} {
  const url = new URL(normalizeBackendBaseUrl(value));
  return {
    host: url.hostname,
    port: url.port,
  };
}

/** Creates a backend service root URL from host and port form values. */
export function createBackendBaseUrl(host: string, port: string): string {
  const trimmedHost = host.trim();
  const trimmedPort = port.trim();
  const hostWithProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmedHost)
    ? trimmedHost
    : `http://${trimmedHost}`;
  const url = new URL(hostWithProtocol);

  if (trimmedPort) {
    url.port = trimmedPort;
  }

  return normalizeBackendBaseUrl(url.toString());
}

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
  return normalizeBackendBaseUrl(typeof source === "function" ? source() : source);
}

/** Normalizes user-entered backend service root URLs before storage and fetch requests. */
export function normalizeBackendBaseUrl(value: string): string {
  const trimmed = value.trim();
  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;
  const url = new URL(withProtocol, window.location.origin);

  return url.origin;
}

/** Checks whether the provided backend API base URL is reachable. */
export async function checkBackendReachability(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl);
  const healthUrl = createBackendHealthUrl(normalizedBaseUrl);

  console.info("[zembra] Checking backend reachability", {
    baseUrl: normalizedBaseUrl,
    healthUrl,
  });

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      cache: "no-store",
      signal,
    });
    const reachable = response.status < 500;

    if (reachable) {
      console.info("[zembra] Backend reachability check passed", {
        healthUrl,
        status: response.status,
      });
    } else {
      console.warn("[zembra] Backend reachability check returned server error", {
        healthUrl,
        status: response.status,
      });
    }

    return reachable;
  } catch (error) {
    if (isAbortError(error)) {
      console.info("[zembra] Backend reachability check was aborted", {
        healthUrl,
      });
    } else {
      console.warn("[zembra] Backend reachability check failed", {
        error,
        healthUrl,
        hint:
          "If curl succeeds but the browser fails, verify backend CORS allows the WebUI origin.",
      });
    }
    return false;
  }
}

/** Loads the configured backend URL or falls back to the Vite default. */
export function getEffectiveBackendBaseUrl(defaultBaseUrl: string): string {
  return normalizeBackendBaseUrl(getConfiguredBackendBaseUrl() ?? defaultBaseUrl);
}

/** Creates the documented service health URL for a configured API base URL. */
export function createBackendHealthUrl(baseUrl: string): string {
  const trimmedBaseUrl = baseUrl.trim();
  const url = new URL(
    trimmedBaseUrl.startsWith("/")
      ? trimmedBaseUrl
      : normalizeBackendBaseUrl(trimmedBaseUrl),
    window.location.origin,
  );
  url.pathname = "/health";
  url.search = "";
  url.hash = "";
  return url.toString();
}

/** Checks whether an unknown thrown value represents fetch cancellation. */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

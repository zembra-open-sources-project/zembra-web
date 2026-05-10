import type { ApiErrorBody } from "./types";
import { notifyBackendConnectionFailed } from "../app/backendConnectionToast";

/** Error thrown when the backend returns a non-successful HTTP response. */
export class ApiError extends Error {
  /** HTTP status code returned by the backend. */
  readonly status: number;
  /** Machine-readable backend error code when available. */
  readonly code?: string;
  /** Backend-specific structured details when available. */
  readonly details?: Record<string, unknown>;

  /** Creates an API error with HTTP and backend error metadata. */
  constructor(status: number, error?: ApiErrorBody) {
    super(error?.message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = error?.code;
    this.details = error?.details;
  }
}

/** Defines options used to create a JSON API request. */
export interface ApiRequestOptions {
  /** HTTP method used for the request. */
  method?: string;
  /** Query parameters appended to the request URL. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** JSON-serializable request body. */
  body?: unknown;
  /** Optional abort signal for request cancellation. */
  signal?: AbortSignal;
}

/** Creates an API URL from a base URL, path, and optional query values. */
export function createApiUrl(
  baseUrl: string,
  path: string,
  query: ApiRequestOptions["query"] = {},
): URL {
  const url = new URL(
    joinApiPath(baseUrl, path),
    globalThis.location?.origin ?? "http://127.0.0.1",
  );

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

/** Sends a JSON request and parses the JSON response when a response body exists. */
export async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetchJsonResponse(baseUrl, path, options);

  const data = await readJsonBody(response);

  if (!response.ok) {
    const error = isErrorResponse(data) ? data.error : undefined;
    throw new ApiError(response.status, error);
  }

  return data as T;
}

/** Sends the underlying fetch request and notifies the app on network failure. */
async function fetchJsonResponse(
  baseUrl: string,
  path: string,
  options: ApiRequestOptions,
): Promise<Response> {
  try {
    return await fetch(createApiUrl(baseUrl, path, options.query), {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    notifyBackendConnectionFailed();
    throw error;
  }
}

/** Joins the configured base URL and request path for absolute or same-origin APIs. */
function joinApiPath(baseUrl: string, path: string): string {
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

/** Reads a JSON response body, returning undefined when no body is present. */
async function readJsonBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  return JSON.parse(text);
}

/** Checks whether an unknown response body matches the backend error wrapper. */
function isErrorResponse(data: unknown): data is { error: ApiErrorBody } {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error?: unknown }).error === "object" &&
    (data as { error?: unknown }).error !== null
  );
}

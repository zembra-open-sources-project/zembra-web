import type { ApiErrorBody } from "./types";

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

/** Creates an absolute API URL from a base URL, path, and optional query values. */
export function createApiUrl(
  baseUrl: string,
  path: string,
  query: ApiRequestOptions["query"] = {},
): URL {
  const url = new URL(path, normalizeBaseUrl(baseUrl));

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
  const response = await fetch(createApiUrl(baseUrl, path, options.query), {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  const data = await readJsonBody(response);

  if (!response.ok) {
    const error = isErrorResponse(data) ? data.error : undefined;
    throw new ApiError(response.status, error);
  }

  return data as T;
}

/** Normalizes the configured base URL so relative paths resolve consistently. */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
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

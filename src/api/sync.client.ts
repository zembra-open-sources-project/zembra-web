import {
  resolveBackendBaseUrl,
  type BackendBaseUrlSource,
} from "./backendConfig";
import { requestJson } from "./http";
import type {
  SyncConfigDto,
  SyncConfigResponse,
  SyncConfigTestResponse,
  SyncConfigTestResultDto,
  SyncRunResponse,
  SyncRunResultDto,
  SyncStateDto,
  SyncStateResponse,
  SyncStatusDto,
  SyncStatusResponse,
  TestSyncConfigInput,
  TestSyncConfigRequest,
  UpdateSyncConfigInput,
  UpdateSyncConfigRequest,
} from "./types";

/** Defines the frontend synchronization settings access boundary. */
export interface SyncClient {
  /** Reads synchronization configuration safe for frontend display. */
  getConfig(): Promise<SyncConfigDto>;
  /** Persists synchronization configuration values. */
  updateConfig(input: UpdateSyncConfigInput): Promise<SyncConfigDto>;
  /** Tests synchronization configuration values without saving them. */
  testConfig(input: TestSyncConfigInput): Promise<SyncConfigTestResultDto>;
  /** Reads synchronization runtime status and cursor rows. */
  getStatus(): Promise<SyncStatusDto>;
  /** Runs one manual push and pull synchronization cycle. */
  runSync(): Promise<SyncRunResultDto>;
}

/** Defines configuration for the HTTP synchronization client. */
export interface SyncHttpClientOptions {
  /** Base URL for the Zembra backend API. */
  baseUrl: BackendBaseUrlSource;
}

/** Creates a synchronization client backed by the Zembra OpenAPI HTTP server. */
export function createSyncHttpClient(options: SyncHttpClientOptions): SyncClient {
  const { baseUrl } = options;

  return {
    async getConfig() {
      const response = await requestJson<SyncConfigResponse>(
        resolveBackendBaseUrl(baseUrl),
        "/sync/config",
      );
      return mapSyncConfigResponseToDto(response);
    },
    async updateConfig(input) {
      const response = await requestJson<SyncConfigResponse>(
        resolveBackendBaseUrl(baseUrl),
        "/sync/config",
        {
          method: "PUT",
          body: createUpdateSyncConfigRequest(input),
        },
      );
      return mapSyncConfigResponseToDto(response);
    },
    async testConfig(input) {
      const response = await requestJson<SyncConfigTestResponse>(
        resolveBackendBaseUrl(baseUrl),
        "/sync/config/test",
        {
          method: "POST",
          body: createTestSyncConfigRequest(input),
        },
      );
      return mapSyncConfigTestResponseToDto(response);
    },
    async getStatus() {
      const response = await requestJson<SyncStatusResponse>(
        resolveBackendBaseUrl(baseUrl),
        "/sync/status",
      );
      return mapSyncStatusResponseToDto(response);
    },
    async runSync() {
      const response = await requestJson<SyncRunResponse>(
        resolveBackendBaseUrl(baseUrl),
        "/sync/run",
        { method: "POST" },
      );
      return mapSyncRunResponseToDto(response);
    },
  };
}

/** Creates a mock synchronization client for tests and local isolated rendering. */
export function createMockSyncClient(): SyncClient {
  let config: SyncConfigDto = {
    enabled: false,
    intervalSeconds: 300,
    supabaseUrl: "https://example.supabase.co",
    serviceRoleKeyConfigured: false,
  };

  return {
    async getConfig() {
      return config;
    },
    async updateConfig(input) {
      config = {
        enabled: input.enabled,
        intervalSeconds: input.intervalSeconds,
        supabaseUrl: input.supabaseUrl,
        serviceRoleKeyConfigured:
          input.serviceRoleKey?.trim() ? true : config.serviceRoleKeyConfigured,
      };
      return config;
    },
    async testConfig() {
      return { ok: true, message: "Configuration accepted" };
    },
    async getStatus() {
      return {
        enabled: config.enabled,
        states: [],
      };
    },
    async runSync() {
      return { pushed: 0, pulled: 0 };
    },
  };
}

/** Maps backend synchronization configuration to the frontend DTO shape. */
export function mapSyncConfigResponseToDto(
  response: SyncConfigResponse,
): SyncConfigDto {
  return {
    enabled: response.enabled,
    intervalSeconds: response.interval_seconds,
    supabaseUrl: response.supabase_url,
    serviceRoleKeyConfigured: response.secret_key_configured,
  };
}

/** Maps backend synchronization status to the frontend DTO shape. */
export function mapSyncStatusResponseToDto(
  response: SyncStatusResponse,
): SyncStatusDto {
  return {
    enabled: response.enabled,
    states: response.states.map(mapSyncStateResponseToDto),
  };
}

/** Maps a backend synchronization cursor to the frontend DTO shape. */
export function mapSyncStateResponseToDto(
  response: SyncStateResponse,
): SyncStateDto {
  return {
    workspaceId: response.workspace_id,
    deviceId: response.device_id,
    scope: response.scope,
    lastChangeCreatedAt: response.last_change_created_at,
    lastChangeId: response.last_change_id,
    lastSuccessAt: response.last_success_at,
    lastErrorAt: response.last_error_at,
    lastErrorMessage: response.last_error_message,
  };
}

/** Maps backend configuration test results to the frontend DTO shape. */
export function mapSyncConfigTestResponseToDto(
  response: SyncConfigTestResponse,
): SyncConfigTestResultDto {
  return {
    ok: response.ok,
    message: response.message,
  };
}

/** Maps backend manual synchronization results to the frontend DTO shape. */
export function mapSyncRunResponseToDto(
  response: SyncRunResponse,
): SyncRunResultDto {
  return {
    pushed: response.pushed,
    pulled: response.pulled,
  };
}

/** Creates the backend request body for persisting synchronization settings. */
export function createUpdateSyncConfigRequest(
  input: UpdateSyncConfigInput,
): UpdateSyncConfigRequest {
  const trimmedKey = input.serviceRoleKey?.trim();
  const request: UpdateSyncConfigRequest = {
    enabled: input.enabled,
    interval_seconds: input.intervalSeconds,
    supabase_url: input.supabaseUrl,
  };

  if (trimmedKey) {
    request.secret_key = trimmedKey;
  }

  return request;
}

/** Creates the backend request body for testing synchronization settings. */
export function createTestSyncConfigRequest(
  input: TestSyncConfigInput,
): TestSyncConfigRequest {
  return {
    supabase_url: normalizeOptionalString(input.supabaseUrl),
    secret_key: normalizeOptionalString(input.serviceRoleKey),
  };
}

/** Normalizes optional text values before they cross the backend API boundary. */
function normalizeOptionalString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

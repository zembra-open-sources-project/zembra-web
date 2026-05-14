import {
  ArrowLeft,
  CheckCircle2,
  DatabaseZap,
  KeyRound,
  Loader2,
  Play,
  Save,
  TestTube2,
  XCircle,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { syncClient as defaultSyncClient } from "../../api/client";
import { ApiError } from "../../api/http";
import type { SyncClient } from "../../api/sync.client";
import type {
  SyncConfigDto,
  SyncConfigTestResultDto,
  SyncRunResultDto,
  SyncStateDto,
  SyncStatusDto,
} from "../../api/types";

interface SyncSettingsPageProps {
  /** Optional client override used by tests and isolated previews. */
  client?: SyncClient;
}

interface SyncSettingsFormState {
  /** Whether background synchronization should be enabled. */
  enabled: boolean;
  /** Supabase project URL draft. */
  supabaseUrl: string;
  /** Synchronization interval draft in seconds. */
  intervalSeconds: string;
  /** Optional new service role key draft. */
  serviceRoleKey: string;
}

const initialFormState: SyncSettingsFormState = {
  enabled: false,
  supabaseUrl: "",
  intervalSeconds: "0",
  serviceRoleKey: "",
};

/** Renders the Supabase synchronization settings page. */
export function SyncSettingsPage({
  client = defaultSyncClient,
}: SyncSettingsPageProps) {
  const [config, setConfig] = useState<SyncConfigDto | undefined>(undefined);
  const [status, setStatus] = useState<SyncStatusDto | undefined>(undefined);
  const [formState, setFormState] =
    useState<SyncSettingsFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [testResult, setTestResult] =
    useState<SyncConfigTestResultDto | undefined>();
  const [runResult, setRunResult] = useState<SyncRunResultDto | undefined>();
  const intervalValidation = useMemo(
    () => validateIntervalSeconds(formState.intervalSeconds),
    [formState.intervalSeconds],
  );

  useEffect(() => {
    let isMounted = true;

    /** Loads persisted configuration and runtime status for the settings page. */
    async function loadSettings() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const [nextConfig, nextStatus] = await Promise.all([
          client.getConfig(),
          client.getStatus(),
        ]);

        if (!isMounted) {
          return;
        }

        setConfig(nextConfig);
        setStatus(nextStatus);
        setFormState(createFormState(nextConfig));
      } catch (error) {
        if (isMounted) {
          setErrorMessage(formatErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [client]);

  /** Persists the current form state through the backend sync API. */
  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (intervalValidation) {
      setErrorMessage(intervalValidation);
      return;
    }

    setIsSaving(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      const nextConfig = await client.updateConfig({
        enabled: formState.enabled,
        intervalSeconds: Number(formState.intervalSeconds),
        supabaseUrl: formState.supabaseUrl.trim(),
        serviceRoleKey: formState.serviceRoleKey,
      });
      const nextStatus = await client.getStatus();

      setConfig(nextConfig);
      setStatus(nextStatus);
      setFormState(createFormState(nextConfig));
      setSuccessMessage("Settings saved");
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  /** Tests the current form state without saving it. */
  async function handleTestConnection() {
    if (intervalValidation) {
      setErrorMessage(intervalValidation);
      return;
    }

    setIsTesting(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    setTestResult(undefined);

    try {
      const result = await client.testConfig({
        supabaseUrl: formState.supabaseUrl,
        serviceRoleKey: formState.serviceRoleKey,
      });
      setTestResult(result);
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setIsTesting(false);
    }
  }

  /** Triggers one manual push and pull synchronization run. */
  async function handleRunSync() {
    setIsRunning(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    setRunResult(undefined);

    try {
      const result = await client.runSync();
      const nextStatus = await client.getStatus();

      setRunResult(result);
      setStatus(nextStatus);
      setSuccessMessage("Manual sync finished");
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f1115] px-5 py-6 text-[#e8edf3] lg:px-0 lg:py-8">
      <div className="mx-auto flex w-full max-w-[980px] flex-col gap-6">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a
              className="mb-5 inline-flex h-9 items-center gap-2 rounded-[9px] px-3 text-sm font-semibold text-[#94a0ae] hover:bg-[#242a33] hover:text-[#def4ff]"
              href="/"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Home
            </a>
            <h1 className="text-3xl font-bold leading-tight text-[#f4f8fb]">
              Supabase Sync
            </h1>
            <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#94a0ae]">
              Configure backend-managed Supabase synchronization without exposing
              stored service role secrets.
            </p>
          </div>

          <StatusPill enabled={status?.enabled ?? config?.enabled ?? false} />
        </header>

        {errorMessage ? (
          <Alert tone="error" message={errorMessage} />
        ) : successMessage ? (
          <Alert tone="success" message={successMessage} />
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <form
            className="rounded-[18px] border border-white/[0.04] bg-[#1c2027] p-5 shadow-[0_16px_38px_rgba(0,0,0,0.34)]"
            onSubmit={handleSave}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#f4f8fb]">Settings</h2>
                <p className="mt-1 text-sm text-[#94a0ae]">
                  Values are saved by the backend sync service.
                </p>
              </div>
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-[#8fd3ff]" />
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex items-center justify-between gap-4 rounded-[12px] bg-[#151922] px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-[#e8edf3]">
                    Enable synchronization
                  </span>
                  <span className="mt-1 block text-xs text-[#94a0ae]">
                    Backend controls the actual sync interval.
                  </span>
                </span>
                <input
                  checked={formState.enabled}
                  className="size-5 accent-[#8fd3ff]"
                  type="checkbox"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      enabled: event.target.checked,
                    }))
                  }
                />
              </label>

              <FieldLabel label="Supabase URL">
                <input
                  className="h-11 w-full rounded-[10px] border border-white/[0.06] bg-[#151922] px-3 text-sm text-[#f4f8fb] outline-none placeholder:text-[#667180] focus:border-[#8fd3ff]/70"
                  placeholder="https://project.supabase.co"
                  value={formState.supabaseUrl}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      supabaseUrl: event.target.value,
                    }))
                  }
                />
              </FieldLabel>

              <FieldLabel
                label="Interval seconds"
                error={intervalValidation}
              >
                <input
                  className="h-11 w-full rounded-[10px] border border-white/[0.06] bg-[#151922] px-3 text-sm text-[#f4f8fb] outline-none placeholder:text-[#667180] focus:border-[#8fd3ff]/70"
                  inputMode="numeric"
                  min="0"
                  placeholder="300"
                  type="number"
                  value={formState.intervalSeconds}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      intervalSeconds: event.target.value,
                    }))
                  }
                />
              </FieldLabel>

              <FieldLabel label="New service role key">
                <input
                  className="h-11 w-full rounded-[10px] border border-white/[0.06] bg-[#151922] px-3 text-sm text-[#f4f8fb] outline-none placeholder:text-[#667180] focus:border-[#8fd3ff]/70"
                  placeholder="Leave blank to keep the existing key"
                  type="password"
                  value={formState.serviceRoleKey}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      serviceRoleKey: event.target.value,
                    }))
                  }
                />
              </FieldLabel>

              <SecretState configured={config?.serviceRoleKeyConfigured ?? false} />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ActionButton
                busy={isTesting}
                icon={<TestTube2 className="size-4" aria-hidden="true" />}
                label="Test Connection"
                type="button"
                onClick={handleTestConnection}
              />
              <ActionButton
                busy={isSaving}
                disabled={Boolean(intervalValidation)}
                icon={<Save className="size-4" aria-hidden="true" />}
                label="Save Settings"
                type="submit"
              />
              <ActionButton
                busy={isRunning}
                icon={<Play className="size-4" aria-hidden="true" />}
                label="Run Sync"
                type="button"
                onClick={handleRunSync}
              />
            </div>
          </form>

          <aside className="flex flex-col gap-4">
            <ResultPanel
              testResult={testResult}
              runResult={runResult}
            />
            <StatusPanel status={status} />
          </aside>
        </section>
      </div>
    </main>
  );
}

/** Creates editable form state from persisted synchronization configuration. */
function createFormState(config: SyncConfigDto): SyncSettingsFormState {
  return {
    enabled: config.enabled,
    supabaseUrl: config.supabaseUrl,
    intervalSeconds: String(config.intervalSeconds),
    serviceRoleKey: "",
  };
}

/** Validates the synchronization interval input. */
function validateIntervalSeconds(value: string): string | undefined {
  if (!/^\d+$/.test(value.trim())) {
    return "Interval seconds must be 0 or a positive integer";
  }

  return undefined;
}

/** Formats an unknown error into a short user-facing message. */
function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}

/** Renders a compact status pill for synchronization enabled state. */
function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <div className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1c2027] px-4 text-sm font-semibold text-[#c9d0d8] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <span
        className="size-2.5 rounded-full data-[enabled=true]:bg-[#8fd3ff] data-[enabled=false]:bg-[#667180]"
        data-enabled={enabled}
      />
      {enabled ? "Sync enabled" : "Sync disabled"}
    </div>
  );
}

/** Renders a form field label with optional validation feedback. */
function FieldLabel({
  children,
  error,
  label,
}: {
  children: ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#c9d0d8]">
        {label}
      </span>
      {children}
      {error ? <span className="mt-2 block text-xs text-[#ff9f9f]">{error}</span> : null}
    </label>
  );
}

/** Renders whether the backend currently stores a service role key. */
function SecretState({ configured }: { configured: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] bg-[#151922] px-4 py-3 text-sm text-[#c9d0d8]">
      <KeyRound className="size-4 text-[#8fd3ff]" aria-hidden="true" />
      <span className="font-semibold">Service role key</span>
      <span className="ml-auto text-[#94a0ae]">
        {configured ? "Configured" : "Not configured"}
      </span>
    </div>
  );
}

/** Renders a reusable action button with an inline busy state. */
function ActionButton({
  busy,
  disabled = false,
  icon,
  label,
  onClick,
  type,
}: {
  busy: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  type: "button" | "submit";
}) {
  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#8fd3ff] px-4 text-sm font-bold text-[#11212d] hover:bg-[#b8e4ff] disabled:cursor-not-allowed disabled:opacity-50"
      disabled={busy || disabled}
      type={type}
      onClick={onClick}
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : icon}
      {label}
    </button>
  );
}

/** Renders success or error feedback above the settings surface. */
function Alert({ message, tone }: { message: string; tone: "error" | "success" }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[12px] border px-4 py-3 text-sm data-[tone=error]:border-[#ff9f9f]/25 data-[tone=error]:bg-[#351f26] data-[tone=error]:text-[#ffd4d4] data-[tone=success]:border-[#8fd3ff]/25 data-[tone=success]:bg-[#132936] data-[tone=success]:text-[#dff5ff]"
      data-tone={tone}
      role="status"
    >
      {tone === "error" ? (
        <XCircle className="size-4" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="size-4" aria-hidden="true" />
      )}
      {message}
    </div>
  );
}

/** Renders the latest test and manual synchronization results. */
function ResultPanel({
  runResult,
  testResult,
}: {
  runResult?: SyncRunResultDto;
  testResult?: SyncConfigTestResultDto;
}) {
  return (
    <section className="rounded-[18px] border border-white/[0.04] bg-[#1c2027] p-5 shadow-[0_16px_38px_rgba(0,0,0,0.28)]">
      <h2 className="mb-4 text-base font-bold text-[#f4f8fb]">Results</h2>
      <div className="flex flex-col gap-3 text-sm text-[#c9d0d8]">
        <div className="rounded-[12px] bg-[#151922] px-4 py-3">
          <div className="font-semibold">Test Connection</div>
          <div className="mt-1 text-[#94a0ae]">
            {testResult ? testResult.message : "No test run yet"}
          </div>
        </div>
        <div className="rounded-[12px] bg-[#151922] px-4 py-3">
          <div className="font-semibold">Manual Sync</div>
          <div className="mt-1 text-[#94a0ae]">
            {runResult
              ? `Pushed ${runResult.pushed}, pulled ${runResult.pulled}`
              : "No sync run yet"}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Renders synchronization cursor status returned by the backend. */
function StatusPanel({ status }: { status?: SyncStatusDto }) {
  return (
    <section className="rounded-[18px] border border-white/[0.04] bg-[#1c2027] p-5 shadow-[0_16px_38px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex items-center gap-2">
        <DatabaseZap className="size-4 text-[#8fd3ff]" aria-hidden="true" />
        <h2 className="text-base font-bold text-[#f4f8fb]">Status</h2>
      </div>

      {!status ? (
        <p className="text-sm text-[#94a0ae]">Loading status</p>
      ) : status.states.length === 0 ? (
        <p className="text-sm text-[#94a0ae]">No sync cursors yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {status.states.map((state) => (
            <SyncStateRow
              key={`${state.workspaceId}-${state.deviceId}-${state.scope}`}
              state={state}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** Renders one synchronization cursor row. */
function SyncStateRow({ state }: { state: SyncStateDto }) {
  return (
    <article className="rounded-[12px] bg-[#151922] px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-[#e8edf3]">{state.scope}</span>
        <span className="text-xs text-[#667180]">
          {formatUnixTimestamp(state.lastChangeCreatedAt)}
        </span>
      </div>
      <div className="mt-2 truncate text-xs text-[#94a0ae]">
        {state.workspaceId} / {state.deviceId}
      </div>
      {state.lastErrorMessage ? (
        <div className="mt-2 text-xs text-[#ffb3b3]">
          {state.lastErrorMessage}
        </div>
      ) : null}
    </article>
  );
}

/** Formats a Unix timestamp for compact settings page status text. */
function formatUnixTimestamp(timestamp: number): string {
  if (timestamp <= 0) {
    return "Never";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(timestamp * 1000));
}

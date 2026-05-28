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
import { useTranslation } from "react-i18next";
import { syncClient as defaultSyncClient } from "../../api/client";
import { ApiError } from "../../api/http";
import { LanguageMenu } from "../../app/LanguageMenu";
import { ThemeToggle } from "../../app/ThemeToggle";
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
  /** Supabase project URL draft. */
  supabaseUrl: string;
  /** Synchronization interval draft in seconds. */
  intervalSeconds: string;
  /** Optional new service role key draft. */
  serviceRoleKey: string;
}

const initialFormState: SyncSettingsFormState = {
  supabaseUrl: "",
  intervalSeconds: "0",
  serviceRoleKey: "",
};

/** Renders the Supabase synchronization settings page. */
export function SyncSettingsPage({
  client = defaultSyncClient,
}: SyncSettingsPageProps) {
  const { i18n, t } = useTranslation("settings");
  const [config, setConfig] = useState<SyncConfigDto | undefined>(undefined);
  const [status, setStatus] = useState<SyncStatusDto | undefined>(undefined);
  const [formState, setFormState] =
    useState<SyncSettingsFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [testResult, setTestResult] =
    useState<SyncConfigTestResultDto | undefined>();
  const [runResult, setRunResult] = useState<SyncRunResultDto | undefined>();
  const intervalValidation = useMemo(
    () =>
      validateIntervalSeconds(
        formState.intervalSeconds,
        t("form.intervalSeconds.errorPositiveInteger"),
      ),
    [formState.intervalSeconds, t],
  );
  const persistedSyncEnabled = status?.enabled ?? config?.enabled ?? false;

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
        enabled: persistedSyncEnabled,
        intervalSeconds: Number(formState.intervalSeconds),
        supabaseUrl: formState.supabaseUrl.trim(),
        serviceRoleKey: formState.serviceRoleKey,
      });
      const nextStatus = await client.getStatus();

      setConfig(nextConfig);
      setStatus(nextStatus);
      setFormState(createFormState(nextConfig));
      setSuccessMessage(t("success.settingsSaved"));
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  /** Persists the current form values and enables synchronization. */
  async function handleSaveAndEnable() {
    if (intervalValidation) {
      setErrorMessage(intervalValidation);
      return;
    }

    setIsEnabling(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      const nextConfig = await client.updateConfig({
        enabled: true,
        intervalSeconds: Number(formState.intervalSeconds),
        supabaseUrl: formState.supabaseUrl.trim(),
        serviceRoleKey: formState.serviceRoleKey,
      });
      const nextStatus = await client.getStatus();

      setConfig(nextConfig);
      setStatus(nextStatus);
      setFormState(createFormState(nextConfig));
      setSuccessMessage(t("success.settingsSaved"));
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setIsEnabling(false);
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
    if (!persistedSyncEnabled) {
      setErrorMessage(t("errors.enableBeforeRun"));
      setSuccessMessage(undefined);
      setRunResult(undefined);
      return;
    }

    setIsRunning(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    setRunResult(undefined);

    try {
      const result = await client.runSync();
      const nextStatus = await client.getStatus();

      setRunResult(result);
      setStatus(nextStatus);
      setSuccessMessage(t("success.manualSyncFinished"));
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-app-bg)] px-5 py-6 text-[var(--color-text-primary)] lg:px-0 lg:py-8">
      <div className="mx-auto flex w-full max-w-[980px] flex-col gap-6">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a
              className="mb-5 inline-flex h-9 items-center gap-2 rounded-[9px] px-3 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
              href="/"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t("home")}
            </a>
            <h1 className="text-3xl font-bold leading-tight text-[var(--color-text-primary)]">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-[620px] text-sm leading-6 text-[var(--color-text-muted)]">
              {t("description")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LanguageMenu />
            <ThemeToggle />
            <StatusPill enabled={persistedSyncEnabled} />
          </div>
        </header>

        {errorMessage ? (
          <Alert tone="error" message={errorMessage} />
        ) : successMessage ? (
          <Alert tone="success" message={successMessage} />
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <form
            className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--color-shadow-card)]"
            onSubmit={handleSave}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t("form.settings.title")}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {t("form.settings.description")}
                </p>
              </div>
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-[var(--color-accent)]" />
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <FieldLabel label={t("form.supabaseUrl.label")}>
                <input
                  className="h-11 w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-strong)]"
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
                label={t("form.intervalSeconds.label")}
                error={intervalValidation}
              >
                <input
                  className="h-11 w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-strong)]"
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

              <FieldLabel label={t("form.serviceRoleKey.label")}>
                <input
                  className="h-11 w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-strong)]"
                  placeholder={t("form.serviceRoleKey.placeholder")}
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

            <div className="mt-6 flex flex-nowrap items-center justify-between gap-3 overflow-x-auto">
              <ActionButton
                busy={isTesting}
                icon={<TestTube2 className="size-4" aria-hidden="true" />}
                label={t("actions.testConnection")}
                type="button"
                onClick={handleTestConnection}
              />
              <ActionButton
                busy={isSaving}
                disabled={Boolean(intervalValidation)}
                icon={<Save className="size-4" aria-hidden="true" />}
                label={t("actions.save")}
                type="submit"
              />
              <ActionButton
                busy={isEnabling}
                disabled={Boolean(intervalValidation)}
                icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
                label={t("actions.saveAndEnable")}
                type="button"
                onClick={() => void handleSaveAndEnable()}
              />
              <ActionButton
                busy={isRunning}
                icon={<Play className="size-4" aria-hidden="true" />}
                label={t("actions.runSync")}
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
            <StatusPanel locale={i18n.resolvedLanguage} status={status} />
          </aside>
        </section>
      </div>
    </main>
  );
}

/** Creates editable form state from persisted synchronization configuration. */
function createFormState(config: SyncConfigDto): SyncSettingsFormState {
  return {
    supabaseUrl: config.supabaseUrl,
    intervalSeconds: String(config.intervalSeconds),
    serviceRoleKey: "",
  };
}

/** Validates the synchronization interval input. */
function validateIntervalSeconds(
  value: string,
  positiveIntegerMessage: string,
): string | undefined {
  if (!/^\d+$/.test(value.trim())) {
    return positiveIntegerMessage;
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
  const { t } = useTranslation("settings");

  return (
    <div className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-secondary)] shadow-[inset_0_0_0_1px_var(--color-border)]">
      <span
        className="size-2.5 rounded-full data-[enabled=true]:bg-[var(--color-accent)] data-[enabled=false]:bg-[var(--color-text-muted)]"
        data-enabled={enabled}
      />
      {enabled ? t("status.enabled") : t("status.disabled")}
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
      <span className="mb-2 block text-sm font-semibold text-[var(--color-text-secondary)]">
        {label}
      </span>
      {children}
      {error ? <span className="mt-2 block text-xs text-[var(--color-error)]">{error}</span> : null}
    </label>
  );
}

/** Renders whether the backend currently stores a service role key. */
function SecretState({ configured }: { configured: boolean }) {
  const { t } = useTranslation("settings");

  return (
    <div className="flex items-center gap-3 rounded-[12px] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
      <KeyRound className="size-4 text-[var(--color-accent)]" aria-hidden="true" />
      <span className="font-semibold">{t("secret.label")}</span>
      <span className="ml-auto text-[var(--color-text-muted)]">
        {configured ? t("secret.configured") : t("secret.notConfigured")}
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
      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--color-accent-contrast)] hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
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
      className="flex items-center gap-3 rounded-[12px] border px-4 py-3 text-sm data-[tone=error]:border-[var(--color-error-border)] data-[tone=error]:bg-[var(--color-error-soft)] data-[tone=error]:text-[var(--color-error)] data-[tone=success]:border-[var(--color-success-border)] data-[tone=success]:bg-[var(--color-success-soft)] data-[tone=success]:text-[var(--color-accent)]"
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
  const { t } = useTranslation("settings");
  const manualSyncLabel = runResult
    ? t("results.manualSyncSummary", {
        pulled: runResult.pulled,
        pushed: runResult.pushed,
      })
    : t("results.noSyncRun");

  return (
    <section className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--color-shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <TestTube2 className="size-4 text-[var(--color-accent)]" aria-hidden="true" />
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">{t("results.title")}</h2>
      </div>
      <div className="divide-y divide-[var(--color-border-subtle)] text-sm">
        <StatusLine
          label={t("results.testConnection")}
          value={testResult ? testResult.message : t("results.noTestRun")}
        />
        <StatusLine
          label={t("results.manualSync")}
          value={manualSyncLabel}
        />
      </div>
    </section>
  );
}

/** Renders one lightweight status row inside a settings status card. */
function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="font-semibold text-[var(--color-text-secondary)]">{label}</span>
      <span className="min-w-0 text-right text-[var(--color-text-muted)]">{value}</span>
    </div>
  );
}

/** Renders synchronization cursor status returned by the backend. */
function StatusPanel({
  locale,
  status,
}: {
  locale?: string;
  status?: SyncStatusDto;
}) {
  const { t } = useTranslation("settings");

  return (
    <section className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--color-shadow-card)]">
      <div className="mb-4 flex items-center gap-2">
        <DatabaseZap className="size-4 text-[var(--color-accent)]" aria-hidden="true" />
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">{t("status.title")}</h2>
      </div>

      {!status ? (
        <p className="text-sm text-[var(--color-text-muted)]">{t("status.loading")}</p>
      ) : status.states.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">{t("status.noCursors")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {status.states.map((state) => (
            <SyncStateRow
              key={`${state.workspaceId}-${state.deviceId}-${state.scope}`}
              locale={locale}
              state={state}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** Renders one synchronization cursor row. */
function SyncStateRow({
  locale,
  state,
}: {
  locale?: string;
  state: SyncStateDto;
}) {
  const { t } = useTranslation("settings");

  return (
    <article className="rounded-[12px] bg-[var(--color-surface-muted)] px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-[var(--color-text-primary)]">{state.scope}</span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {formatUnixTimestamp(state.lastChangeCreatedAt, locale, t("status.never"))}
        </span>
      </div>
      <div className="mt-2 truncate text-xs text-[var(--color-text-muted)]">
        {state.workspaceId} / {state.deviceId}
      </div>
      {state.lastErrorMessage ? (
        <div className="mt-2 text-xs text-[var(--color-error)]">
          {state.lastErrorMessage}
        </div>
      ) : null}
    </article>
  );
}

/** Formats a Unix timestamp for compact settings page status text. */
function formatUnixTimestamp(
  timestamp: number,
  locale = "zh-CN",
  neverLabel = "Never",
): string {
  if (timestamp <= 0) {
    return neverLabel;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(timestamp * 1000));
}

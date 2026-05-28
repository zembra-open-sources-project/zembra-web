import {
  CheckCircle2,
  Loader2,
  Save,
  TestTube2,
  XCircle,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { syncClient as defaultSyncClient } from "../../api/client";
import { ApiError } from "../../api/http";
import type { SyncClient } from "../../api/sync.client";
import type { SyncConfigDto, SyncConfigTestResultDto } from "../../api/types";

interface SupabaseSettingsSectionProps {
  /** Optional client override used by tests and isolated previews. */
  client?: SyncClient;
}

interface SupabaseSettingsFormState {
  /** Supabase project URL draft. */
  supabaseUrl: string;
  /** Optional new secret key draft. */
  secretKey: string;
  /** Synchronization interval draft in seconds. */
  intervalSeconds: string;
}

const initialFormState: SupabaseSettingsFormState = {
  intervalSeconds: "0",
  secretKey: "",
  supabaseUrl: "",
};

/** Renders the Supabase synchronization section inside the Settings modal. */
export function SupabaseSettingsSection({
  client = defaultSyncClient,
}: SupabaseSettingsSectionProps) {
  const { t } = useTranslation("settings");
  const [config, setConfig] = useState<SyncConfigDto | undefined>(undefined);
  const [formState, setFormState] =
    useState<SupabaseSettingsFormState>(initialFormState);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [testResult, setTestResult] =
    useState<SyncConfigTestResultDto | undefined>();
  const intervalValidation = useMemo(
    () =>
      validateIntervalSeconds(
        formState.intervalSeconds,
        t("supabase.intervalSecondsError"),
      ),
    [formState.intervalSeconds, t],
  );

  useEffect(() => {
    let isMounted = true;

    /** Loads persisted Supabase synchronization configuration. */
    async function loadConfig() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const nextConfig = await client.getConfig();

        if (!isMounted) {
          return;
        }

        setConfig(nextConfig);
        setFormState(createFormState(nextConfig));
        setSyncEnabled(nextConfig.enabled);
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

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, [client]);

  /** Persists the current Supabase section form values. */
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
      const nextConfig = await saveConfig(syncEnabled);

      setConfig(nextConfig);
      setFormState(createFormState(nextConfig));
      setSyncEnabled(nextConfig.enabled);
      setSuccessMessage(t("success.settingsSaved"));
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  /** Updates the persisted synchronization enabled flag from the switch. */
  async function handleSyncEnabledChange(nextEnabled: boolean) {
    if (intervalValidation) {
      setErrorMessage(intervalValidation);
      return;
    }

    const previousEnabled = syncEnabled;
    setSyncEnabled(nextEnabled);
    setIsTogglingEnabled(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      const nextConfig = await saveConfig(nextEnabled);

      setConfig(nextConfig);
      setFormState(createFormState(nextConfig));
      setSyncEnabled(nextConfig.enabled);
      setSuccessMessage(t("success.settingsSaved"));
    } catch (error) {
      setSyncEnabled(previousEnabled);
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setIsTogglingEnabled(false);
    }
  }

  /** Tests the current Supabase form values without saving them. */
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
        serviceRoleKey: formState.secretKey,
        supabaseUrl: formState.supabaseUrl,
      });

      setTestResult(result);
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setIsTesting(false);
    }
  }

  /** Persists the current form values with the requested enabled state. */
  async function saveConfig(enabled: boolean): Promise<SyncConfigDto> {
    return client.updateConfig({
      enabled,
      intervalSeconds: Number(formState.intervalSeconds),
      serviceRoleKey: formState.secretKey,
      supabaseUrl: formState.supabaseUrl.trim(),
    });
  }

  return (
    <section aria-labelledby="supabase-settings-title" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2
            className="text-sm font-semibold text-[var(--color-text-muted)]"
            id="supabase-settings-title"
          >
            {t("supabase.title")}
          </h2>
        </div>
        {isLoading ? (
          <Loader2
            className="mt-1 size-5 shrink-0 animate-spin text-[var(--color-accent)]"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {errorMessage ? (
        <Alert tone="error" message={errorMessage} />
      ) : successMessage ? (
        <Alert tone="success" message={successMessage} />
      ) : null}

      <form className="mt-3 min-w-0" onSubmit={handleSave}>
        <div className="overflow-hidden rounded-[16px] bg-[var(--color-surface-muted)] shadow-[inset_0_0_0_1px_var(--color-border)]">
          <FieldLabel label={t("supabase.url")}>
            <input
              className="h-9 w-full rounded-[6px] bg-transparent px-2 text-right text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:bg-[var(--color-surface)] focus:shadow-[inset_0_0_0_1px_var(--color-border-strong)]"
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

          <FieldLabel label={t("supabase.secretKey")}>
            <input
              className="h-9 w-full rounded-[6px] bg-transparent px-2 text-right text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:bg-[var(--color-surface)] focus:shadow-[inset_0_0_0_1px_var(--color-border-strong)]"
              placeholder={t("supabase.secretPlaceholder")}
              type="password"
              value={formState.secretKey}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  secretKey: event.target.value,
                }))
              }
            />
          </FieldLabel>

          <FieldLabel
            error={intervalValidation}
            label={t("supabase.intervalSeconds")}
          >
            <input
              className="h-9 w-full rounded-[6px] bg-transparent px-2 text-right text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:bg-[var(--color-surface)] focus:shadow-[inset_0_0_0_1px_var(--color-border-strong)]"
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

          <SettingRow label={t("supabase.enableSync")}>
            <label className="relative inline-flex h-7 w-12 shrink-0 items-center justify-self-end">
              <input
                checked={syncEnabled}
                className="peer sr-only"
                disabled={isLoading || isTogglingEnabled}
                role="switch"
                type="checkbox"
                aria-label={t("supabase.enableSync")}
                onChange={(event) =>
                  void handleSyncEnabledChange(event.target.checked)
                }
              />
              <span className="absolute inset-0 rounded-full bg-[var(--color-border)] transition peer-checked:bg-[var(--color-accent)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent)]" />
              <span className="absolute left-1 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
            </label>
          </SettingRow>
        </div>

        {testResult ? (
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]" role="status">
            {testResult.message}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <ActionButton
            busy={isTesting}
            icon={<TestTube2 className="size-4" aria-hidden="true" />}
            label={t("actions.test")}
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
        </div>
      </form>
    </section>
  );
}

/** Creates editable form state from persisted synchronization configuration. */
function createFormState(config: SyncConfigDto): SupabaseSettingsFormState {
  return {
    intervalSeconds: String(config.intervalSeconds),
    secretKey: "",
    supabaseUrl: config.supabaseUrl,
  };
}

/** Validates that the interval seconds input is a non-negative integer string. */
function validateIntervalSeconds(
  value: string,
  positiveIntegerMessage: string,
): string | undefined {
  if (!/^\d+$/.test(value.trim())) {
    return positiveIntegerMessage;
  }

  return undefined;
}

/** Formats an unknown thrown value into a short user-facing message. */
function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "Request failed";
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
    <label className="grid min-w-0 grid-cols-[150px_minmax(0,1fr)] items-center gap-4 border-b border-[var(--color-border-subtle)] px-4 py-3 last:border-b-0">
      <span className="min-w-0 text-sm font-semibold text-[var(--color-text-primary)]">
        {label}
      </span>
      <span className="min-w-0">{children}</span>
      {error ? (
        <span className="col-start-2 block text-right text-xs text-[var(--color-error)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

/** Renders one compact settings row with label and control on the same line. */
function SettingRow({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[150px_minmax(0,1fr)] items-center gap-4 border-b border-[var(--color-border-subtle)] px-4 py-3 last:border-b-0">
      <div className="min-w-0 text-sm font-semibold text-[var(--color-text-primary)]">
        {label}
      </div>
      <div className="flex min-w-0 justify-end">{children}</div>
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
      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] px-3 py-2 text-sm font-semibold text-[var(--color-accent)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
      disabled={busy || disabled}
      type={type}
      onClick={onClick}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {label}
    </button>
  );
}

/** Renders success or error feedback inside the Supabase settings section. */
function Alert({
  message,
  tone,
}: {
  message: string;
  tone: "error" | "success";
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-[12px] border px-4 py-3 text-sm data-[tone=error]:border-[var(--color-error-border)] data-[tone=error]:bg-[var(--color-error-soft)] data-[tone=error]:text-[var(--color-error)] data-[tone=success]:border-[var(--color-success-border)] data-[tone=success]:bg-[var(--color-success-soft)] data-[tone=success]:text-[var(--color-accent)]"
      data-tone={tone}
      role="status"
    >
      {tone === "error" ? (
        <XCircle className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
      )}
      <span className="min-w-0">{message}</span>
    </div>
  );
}

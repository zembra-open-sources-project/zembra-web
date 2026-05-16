import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  checkBackendReachability,
  clearConfiguredBackendBaseUrl,
  createBackendBaseUrl,
  defaultBackendBaseUrl,
  getConfiguredBackendBaseUrl,
  parseBackendEndpoint,
  setConfiguredBackendBaseUrl,
} from "../api/backendConfig";

interface BackendUrlGateProps {
  /** Application content rendered after the backend URL is reachable. */
  children: ReactNode;
}

type GateStatus = "checking" | "ready" | "needs-url";
const defaultBackendEndpoint = parseBackendEndpoint(defaultBackendBaseUrl);

/** Gates the app behind a reachable backend API base URL. */
export function BackendUrlGate({ children }: BackendUrlGateProps) {
  const { t } = useTranslation("common");
  const [status, setStatus] = useState<GateStatus>("checking");
  const [backendHost, setBackendHost] = useState(() => {
    const configuredUrl = getConfiguredBackendBaseUrl();
    return configuredUrl ? parseBackendEndpoint(configuredUrl).host : "";
  });
  const [backendPort, setBackendPort] = useState(() => {
    const configuredUrl = getConfiguredBackendBaseUrl();
    return configuredUrl ? parseBackendEndpoint(configuredUrl).port : "";
  });
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const configuredUrl = getConfiguredBackendBaseUrl();

    if (!configuredUrl) {
      console.info("[zembra] Backend URL is not configured; showing URL gate");
      setStatus("needs-url");
      return;
    }

    console.info("[zembra] Validating saved backend URL before app startup", {
      backendUrl: configuredUrl,
    });
    const controller = new AbortController();

    void checkBackendReachability(configuredUrl, controller.signal).then((ok) => {
      if (!ok) {
        console.warn("[zembra] Saved backend URL is unreachable; clearing config", {
          backendUrl: configuredUrl,
        });
        clearConfiguredBackendBaseUrl();
        setError(t("backend.login.savedUrlUnavailable"));
        setStatus("needs-url");
        return;
      }

      console.info("[zembra] Saved backend URL is reachable; opening app");
      setStatus("ready");
    });

    return () => controller.abort();
  }, [t]);

  /** Validates and stores the backend URL entered by the user. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidateHost = backendHost.trim() || defaultBackendEndpoint.host;
    const candidatePort = backendPort.trim() || defaultBackendEndpoint.port;

    setIsSubmitting(true);
    setError(undefined);

    const normalizedUrl = createBackendBaseUrl(candidateHost, candidatePort);
    console.info("[zembra] User submitted backend URL", {
      backendUrl: normalizedUrl,
    });
    const ok = await checkBackendReachability(normalizedUrl);

    setIsSubmitting(false);

    if (!ok) {
      console.warn("[zembra] User submitted backend URL is unreachable", {
        backendUrl: normalizedUrl,
      });
      setError(t("backend.login.unreachable"));
      return;
    }

    setConfiguredBackendBaseUrl(normalizedUrl);
    console.info("[zembra] Backend URL saved; opening app", {
      backendUrl: normalizedUrl,
    });
    const endpoint = parseBackendEndpoint(normalizedUrl);
    setBackendHost(endpoint.host);
    setBackendPort(endpoint.port);
    setStatus("ready");
  }

  if (status === "ready") {
    return children;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)] px-5 text-[var(--color-text-primary)]">
      <section className="w-full max-w-[420px]">
        <div className="mb-8">
          <div className="mb-3 text-2xl font-bold">Zembra</div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {t("backend.login.description")}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-[1fr_116px] gap-3">
            <label className="block text-sm font-medium">
              <span className="sr-only">{t("backend.login.hostLabel")}</span>
              <input
                aria-label={t("backend.login.hostLabel")}
                className="h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-border-strong)]"
                name="backend-host"
                onChange={(event) => setBackendHost(event.target.value)}
                placeholder={t("backend.login.hostPlaceholder", {
                  host: defaultBackendEndpoint.host,
                })}
                value={backendHost}
              />
            </label>
            <label className="block text-sm font-medium">
              <span className="sr-only">{t("backend.login.portLabel")}</span>
              <input
                aria-label={t("backend.login.portLabel")}
                className="h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-border-strong)]"
                inputMode="numeric"
                name="backend-port"
                onChange={(event) => setBackendPort(event.target.value)}
                placeholder={t("backend.login.portPlaceholder", {
                  port: defaultBackendEndpoint.port,
                })}
                value={backendPort}
              />
            </label>
          </div>

          {error ? (
            <p
              className="rounded-[8px] border border-[var(--color-error-border)] bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            className="h-11 w-full rounded-[8px] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)] transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || status === "checking"}
            type="submit"
          >
            {status === "checking" || isSubmitting
              ? t("backend.login.checking")
              : t("backend.login.submit")}
          </button>
        </form>
      </section>
    </main>
  );
}

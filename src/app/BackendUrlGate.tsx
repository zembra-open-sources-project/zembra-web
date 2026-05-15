import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  checkBackendReachability,
  clearConfiguredBackendBaseUrl,
  getConfiguredBackendBaseUrl,
  normalizeBackendBaseUrl,
  setConfiguredBackendBaseUrl,
} from "../api/backendConfig";

interface BackendUrlGateProps {
  /** Application content rendered after the backend URL is reachable. */
  children: ReactNode;
}

type GateStatus = "checking" | "ready" | "needs-url";

/** Gates the app behind a reachable backend API base URL. */
export function BackendUrlGate({ children }: BackendUrlGateProps) {
  const { t } = useTranslation("common");
  const [status, setStatus] = useState<GateStatus>("checking");
  const [backendUrl, setBackendUrl] = useState(
    () => getConfiguredBackendBaseUrl() ?? "",
  );
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const configuredUrl = getConfiguredBackendBaseUrl();

    if (!configuredUrl) {
      setStatus("needs-url");
      return;
    }

    const controller = new AbortController();

    void checkBackendReachability(configuredUrl, controller.signal).then((ok) => {
      if (!ok) {
        clearConfiguredBackendBaseUrl();
        setError(t("backend.login.savedUrlUnavailable"));
        setStatus("needs-url");
        return;
      }

      setStatus("ready");
    });

    return () => controller.abort();
  }, [t]);

  /** Validates and stores the backend URL entered by the user. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidateUrl = backendUrl.trim();

    if (!candidateUrl) {
      setError(t("backend.login.emptyUrl"));
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    const normalizedUrl = normalizeBackendBaseUrl(candidateUrl);
    const ok = await checkBackendReachability(normalizedUrl);

    setIsSubmitting(false);

    if (!ok) {
      setError(t("backend.login.unreachable"));
      return;
    }

    setConfiguredBackendBaseUrl(normalizedUrl);
    setBackendUrl(normalizedUrl);
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
          <h1 className="text-[22px] font-semibold leading-tight">
            {t("backend.login.title")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {t("backend.login.description")}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            <span>{t("backend.login.urlLabel")}</span>
            <input
              className="mt-2 h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none transition focus:border-[var(--color-border-strong)]"
              name="backend-url"
              onChange={(event) => setBackendUrl(event.target.value)}
              placeholder="http://127.0.0.1:8000/api"
              value={backendUrl}
            />
          </label>

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

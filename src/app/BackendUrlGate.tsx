import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, RefreshCw } from "lucide-react";
import { listWorkspaces } from "../api/client";
import {
  checkBackendReachability,
  clearConfiguredBackendBaseUrl,
  clearConfiguredWorkspaceId,
  createBackendBaseUrl,
  defaultBackendBaseUrl,
  getConfiguredBackendBaseUrl,
  getConfiguredWorkspaceId,
  parseBackendEndpoint,
  setConfiguredBackendBaseUrl,
  setConfiguredWorkspaceId,
} from "../api/backendConfig";
import type { WorkspaceSummary } from "../api/types";

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
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [hasLoadedWorkspaces, setHasLoadedWorkspaces] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);

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

    void checkBackendReachability(configuredUrl, controller.signal).then(async (ok) => {
      if (!ok) {
        console.warn("[zembra] Saved backend URL is unreachable; clearing config", {
          backendUrl: configuredUrl,
        });
        clearConfiguredBackendBaseUrl();
        setError(t("backend.login.savedUrlUnavailable"));
        setStatus("needs-url");
        return;
      }

      console.info("[zembra] Saved backend URL is reachable; loading workspaces");
      const endpoint = parseBackendEndpoint(configuredUrl);
      setBackendHost(endpoint.host);
      setBackendPort(endpoint.port);
      await loadWorkspaces(configuredUrl, { checksReachability: false });
    });

    return () => controller.abort();
  }, [t]);

  /** Validates the backend URL and loads available workspaces. */
  async function handleLoadWorkspaces() {
    const candidateHost = backendHost.trim() || defaultBackendEndpoint.host;
    const candidatePort = backendPort.trim() || defaultBackendEndpoint.port;
    const normalizedUrl = createBackendBaseUrl(candidateHost, candidatePort);

    await loadWorkspaces(normalizedUrl, { checksReachability: true });
  }

  /** Loads workspaces from a backend URL after optional reachability validation. */
  async function loadWorkspaces(
    normalizedUrl: string,
    options: { checksReachability: boolean },
  ) {
    setIsSubmitting(true);
    setIsLoadingWorkspaces(true);
    setError(undefined);
    setHasLoadedWorkspaces(false);
    setWorkspaces([]);
    setSelectedWorkspaceId("");

    console.info("[zembra] Loading workspaces for backend URL", {
      backendUrl: normalizedUrl,
    });

    const ok = options.checksReachability
      ? await checkBackendReachability(normalizedUrl)
      : true;

    if (!ok) {
      console.warn("[zembra] User submitted backend URL is unreachable", {
        backendUrl: normalizedUrl,
      });
      setError(t("backend.login.unreachable"));
      setIsSubmitting(false);
      setIsLoadingWorkspaces(false);
      return;
    }

    setConfiguredBackendBaseUrl(normalizedUrl);
    const endpoint = parseBackendEndpoint(normalizedUrl);
    setBackendHost(endpoint.host);
    setBackendPort(endpoint.port);

    try {
      const response = await listWorkspaces();
      const nextWorkspaces = response.workspaces;
      setWorkspaces(nextWorkspaces);
      setHasLoadedWorkspaces(true);

      if (nextWorkspaces.length === 0) {
        console.info("[zembra] Backend returned no workspaces", {
          backendUrl: normalizedUrl,
          workspaceCount: 0,
        });
        setError(t("backend.login.noWorkspaces"));
        return;
      }

      const savedWorkspaceId = getConfiguredWorkspaceId();
      const savedWorkspace = savedWorkspaceId
        ? nextWorkspaces.find(
            (workspace) => workspace.workspace_id === savedWorkspaceId,
          )
        : undefined;

      if (savedWorkspaceId && !savedWorkspace) {
        console.warn("[zembra] Saved workspace is no longer available", {
          workspaceId: savedWorkspaceId.slice(0, 8),
        });
        clearConfiguredWorkspaceId();
        setError(t("backend.login.savedWorkspaceUnavailable"));
      }

      const defaultWorkspace =
        savedWorkspace ?? findWorkspaceWithMostVisibleNotes(nextWorkspaces);
      setSelectedWorkspaceId(defaultWorkspace.workspace_id);
      console.info("[zembra] Workspaces loaded", {
        selectedWorkspaceId: defaultWorkspace.workspace_id.slice(0, 8),
        workspaceCount: nextWorkspaces.length,
      });
    } catch (error) {
      console.warn("[zembra] Failed to load workspaces", {
        backendUrl: normalizedUrl,
        error,
      });
      setError(t("backend.login.workspacesUnavailable"));
    } finally {
      setIsSubmitting(false);
      setIsLoadingWorkspaces(false);
    }
  }

  /** Saves the selected workspace and opens the application. */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedWorkspaceId) {
      return;
    }

    setConfiguredWorkspaceId(selectedWorkspaceId);
    console.info("[zembra] Workspace selected; opening app", {
      workspaceId: selectedWorkspaceId.slice(0, 8),
    });
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
          <div className="text-sm font-medium text-[var(--color-text-primary)]">
            Backend
          </div>
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

          <div className="text-sm font-medium text-[var(--color-text-primary)]">
            {t("backend.login.workspaceLabel")}
          </div>
          <div className="grid grid-cols-[1fr_44px] gap-3">
            <label className="block text-sm font-medium">
              <span className="sr-only">
                {t("backend.login.workspaceLabel")}
              </span>
              <select
                aria-label={t("backend.login.workspaceLabel")}
                className="h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-border-strong)] disabled:text-[var(--color-text-muted)]"
                disabled={workspaces.length === 0 || isLoadingWorkspaces}
                name="workspace"
                onChange={(event) => setSelectedWorkspaceId(event.target.value)}
                value={selectedWorkspaceId}
              >
                <option value="">
                  {t("backend.login.workspacePlaceholder")}
                </option>
                {workspaces.map((workspace) => (
                  <option
                    key={workspace.workspace_id}
                    value={workspace.workspace_id}
                  >
                    {formatWorkspaceOption(workspace)}
                  </option>
                ))}
              </select>
            </label>
            <button
              aria-label={
                hasLoadedWorkspaces
                  ? t("backend.login.refreshWorkspacesAction")
                  : t("backend.login.loadWorkspacesAction")
              }
              className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || status === "checking"}
              onClick={() => void handleLoadWorkspaces()}
              type="button"
            >
              {isLoadingWorkspaces ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="size-4" aria-hidden="true" />
              )}
            </button>
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
            disabled={
              isSubmitting ||
              status === "checking" ||
              !selectedWorkspaceId ||
              workspaces.length === 0
            }
            type="submit"
          >
            {status === "checking" || isSubmitting
              ? t("backend.login.checking")
              : t("backend.login.enterAction")}
          </button>
        </form>
      </section>
    </main>
  );
}

/** Returns the workspace with the highest visible note count. */
function findWorkspaceWithMostVisibleNotes(
  workspaces: WorkspaceSummary[],
): WorkspaceSummary {
  return workspaces.reduce((selected, workspace) =>
    workspace.visible_note_count > selected.visible_note_count
      ? workspace
      : selected,
  );
}

/** Formats one workspace option with a display name and note count. */
function formatWorkspaceOption(workspace: WorkspaceSummary): string {
  const name =
    workspace.workspace_name?.trim() || workspace.workspace_id.slice(0, 8);
  return `${name} ${workspace.visible_note_count}`;
}

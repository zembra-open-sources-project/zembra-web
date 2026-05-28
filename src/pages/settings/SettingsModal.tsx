import { X } from "lucide-react";
import { SupabaseSettingsSection } from "./SupabaseSettingsSection";
import type { SyncClient } from "../../api/sync.client";
import { useTranslation } from "react-i18next";

interface SettingsModalProps {
  /** Optional client override used by tests and isolated previews. */
  client?: SyncClient;
  /** Called when the modal should close. */
  onClose: () => void;
}

/** Renders the global Settings modal with a Supabase configuration section. */
export function SettingsModal({ client, onClose }: SettingsModalProps) {
  const { t } = useTranslation("settings");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        className="absolute inset-0 bg-black/35"
        type="button"
        aria-label={t("close")}
        onClick={onClose}
      />
      <div
        className="relative max-h-full w-full max-w-[640px] overflow-y-auto rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-[var(--color-text-primary)] shadow-[var(--color-shadow-card)] sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <h1
            className="text-xl font-bold text-[var(--color-text-primary)]"
            id="settings-modal-title"
          >
            {t("title")}
          </h1>
          <button
            className="flex size-9 shrink-0 items-center justify-center rounded-[9px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
            type="button"
            aria-label={t("close")}
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <SupabaseSettingsSection client={client} />
      </div>
    </div>
  );
}

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SyncClient } from "../../api/sync.client";
import { settingsCategories } from "./settingsRegistry";

interface SettingsModalProps {
  /** Optional client override used by tests and isolated previews. */
  client?: SyncClient;
  /** Called when the modal should close. */
  onClose: () => void;
}

/** Renders the global Settings modal as a single-surface settings shell. */
export function SettingsModal({ client, onClose }: SettingsModalProps) {
  const { t } = useTranslation("settings");
  const initialCategoryId = settingsCategories[0]?.id;
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const activeCategory = useMemo(
    () =>
      settingsCategories.find((category) => category.id === activeCategoryId) ??
      settingsCategories[0],
    [activeCategoryId],
  );

  if (!activeCategory) {
    return null;
  }

  const activeCategoryLabel = t(activeCategory.labelKey);
  const activeCategoryTitle = t(activeCategory.titleKey);
  const activeCategoryDescription = activeCategory.descriptionKey
    ? t(activeCategory.descriptionKey)
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-6 sm:py-8">
      <button
        className="absolute inset-0 bg-black/35"
        type="button"
        aria-label={t("close")}
        onClick={onClose}
      />
      <div
        className="relative grid max-h-full w-full max-w-[700px] grid-cols-1 overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--color-shadow-float)] md:h-[450px] md:grid-cols-[200px_minmax(0,1fr)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <aside className="flex min-w-0 flex-col px-3 pb-3 pt-3 md:min-h-[450px] md:px-4 md:pb-5 md:pt-5">
          <div className="flex min-h-11 items-center">
            <button
              className="flex size-10 shrink-0 items-center justify-center rounded-[10px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
              type="button"
              aria-label={t("close")}
              onClick={onClose}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <nav
            className="mt-2 flex min-w-0 gap-1 overflow-x-auto pb-1 md:mt-7 md:flex-col md:overflow-visible md:pb-0"
            aria-label={t("title")}
          >
            {settingsCategories.map((category) => {
              const Icon = category.icon;
              const label = t(category.labelKey);

              return (
                <button
                  key={category.id}
                  className="flex min-h-10 shrink-0 items-center gap-3 rounded-[12px] px-3 text-left text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] md:w-full"
                  type="button"
                  aria-current={
                    category.id === activeCategory.id ? "page" : undefined
                  }
                  data-active={category.id === activeCategory.id}
                  onClick={() => setActiveCategoryId(category.id)}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-h-0 min-w-0 overflow-y-auto px-5 pb-6 pt-4 sm:px-8 md:px-8 md:pb-6 md:pt-8">
          <h1
            className="text-2xl font-semibold text-[var(--color-text-primary)]"
            id="settings-modal-title"
          >
            {activeCategoryTitle}
          </h1>
          {activeCategoryDescription ? (
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {activeCategoryDescription}
            </p>
          ) : null}
          <div className="mt-7 border-t border-[var(--color-border)] pt-0">
            {activeCategory.renderContent({ client })}
          </div>
        </main>
      </div>
    </div>
  );
}

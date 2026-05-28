import { ReactNode } from "react";

/**
 * Props for CompactSettingsCard.
 */
export interface CompactSettingsCardProps {
  /**
   * Small semantic title for the card (e.g. "连接信息" or "同步设置").
   */
  title: string;

  /**
   * The rows inside the card. Typically multiple CompactFieldRow components.
   */
  children: ReactNode;
}

/**
 * Renders one extremely compact white card used inside the settings panel.
 *
 * Follows r016 design:
 * - Pure white background (--color-surface)
 * - Very tight internal padding (px-3 py-2)
 * - Small bold title at the top
 * - Minimal visual chrome so the focus stays on the fields
 * - Used to create clear semantic grouping without heavy borders
 */
export function CompactSettingsCard({ title, children }: CompactSettingsCardProps) {
  return (
    <div className="rounded-[8px] bg-[var(--color-surface)] px-3 py-2 shadow-[inset_0_0_0_1px_var(--color-border-subtle)]">
      <div className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

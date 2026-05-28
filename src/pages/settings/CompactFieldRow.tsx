import { ReactNode } from "react";

/**
 * Props for the CompactFieldRow component.
 */
export interface CompactFieldRowProps {
  /**
   * The label text displayed on the left side.
   * Must be short enough to fit within ~110px without wrapping.
   */
  label: string;

  /**
   * The content on the right side (typically an input or control).
   * This area is expected to be right-aligned by the consumer.
   */
  children: ReactNode;

  /**
   * Optional validation error message displayed below the children.
   * Rendered in error color, right-aligned.
   */
  error?: string;

  /**
   * Optional help text displayed below the main row (e.g. "留空则保留现有 secret").
   * Rendered in muted color with smaller font.
   */
  helpText?: string;
}

/**
 * Renders a single extremely compact settings field row.
 *
 * Design constraints (per r016 design doc):
 * - Label column is fixed at 110px to guarantee Chinese labels (e.g. "同步间隔秒数") never wrap or truncate.
 * - Vertical rhythm is deliberately tight (py-1.5 ~ py-2) to achieve the "极致紧凑" requirement.
 * - No bottom border on the row itself — the underline affordance lives on the input/control.
 * - Right side content is placed in a flex container that naturally supports right alignment from children.
 *
 * This component is layout-only. It does not manage any form state or validation logic.
 */
export function CompactFieldRow({
  label,
  children,
  error,
  helpText,
}: CompactFieldRowProps) {
  return (
    <div className="min-w-0">
      <div className="grid min-w-0 grid-cols-[110px_minmax(0,1fr)] items-center gap-3 py-1.5">
        <span className="min-w-0 text-sm font-semibold text-[var(--color-text-primary)]">
          {label}
        </span>

        <div className="flex min-w-0 justify-end">{children}</div>
      </div>

      {helpText ? (
        <div className="pl-[110px] text-[11px] text-[var(--color-text-muted)]">
          {helpText}
        </div>
      ) : null}

      {error ? (
        <div className="pl-[110px] text-right text-xs text-[var(--color-error)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}

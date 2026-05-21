import { CalendarDays } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { DailyNoteCount } from "../../api/types";
import { formatHeatmapDate, getHeatmapLevel } from "./homeUtils";

/** Renders a single statistic block in the sidebar. */
export function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[30px] font-bold leading-none text-[var(--color-text-secondary)]">
        {value}
      </div>
      <div className="mt-2 text-[13px] text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}

/** Renders the recent daily note count calendar heatmap in the sidebar. */
export function DailyNotesHeatmap({
  days,
  locale = "zh-CN",
}: {
  days: DailyNoteCount[];
  locale?: string;
}) {
  const { t } = useTranslation("home");
  const maxCount = Math.max(0, ...days.map((day) => day.count));

  if (days.length === 0) {
    return (
      <section
        aria-label={t("heatmap.ariaLabel")}
        className="hidden w-[300px] rounded-[12px] border border-dashed border-[var(--color-border)] px-3 py-3 text-sm text-[var(--color-text-muted)] lg:block"
      >
        {t("heatmap.empty")}
      </section>
    );
  }

  return (
    <section
      aria-label={t("heatmap.ariaLabel")}
      className="hidden w-[300px] lg:block"
    >
      <div className="mb-2 flex items-center justify-between gap-3 text-[13px] text-[var(--color-text-muted)]">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
          <span className="truncate">{t("heatmap.title")}</span>
        </span>
        <span className="shrink-0">{t("heatmap.days", { count: days.length })}</span>
      </div>
      <div className="grid grid-flow-col grid-rows-5 gap-[7px]">
        {days.map((day) => {
          const level = getHeatmapLevel(day.count, maxCount);
          const label = t("heatmap.dayLabel", {
            count: day.count,
            date: formatHeatmapDate(day.date, locale),
          });

          return (
            <span
              aria-label={label}
              className="flex h-[35px] min-w-0 items-center justify-center rounded-[6px] bg-[var(--color-surface-muted)] text-[10px] font-semibold leading-none text-[var(--color-text-muted)] shadow-[inset_0_0_0_1px_var(--color-border-subtle)] data-[level='1']:bg-[color-mix(in_srgb,var(--color-accent)_18%,var(--color-surface-muted))] data-[level='2']:bg-[color-mix(in_srgb,var(--color-accent)_34%,var(--color-surface-muted))] data-[level='3']:bg-[color-mix(in_srgb,var(--color-accent)_58%,var(--color-surface-muted))] data-[level='4']:bg-[var(--color-accent)] data-[level='4']:text-[var(--color-accent-contrast)]"
              data-level={level}
              key={day.date}
              title={label}
            >
              {Number(day.date.slice(-2))}
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-[var(--color-text-muted)]">
        <span>{formatHeatmapDate(days[0]?.date, locale)}</span>
        <span>{formatHeatmapDate(days.at(-1)?.date, locale)}</span>
      </div>
    </section>
  );
}

/** Renders a titled sidebar navigation section. */
export function SidebarSection({
  children,
  className = "mt-6",
  title,
}: {
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-xs font-normal tracking-[0.02em] text-[var(--color-warm)]">
        {title}
      </h2>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

/** Renders a sidebar navigation row for fields or tags. */
export function NavItem({
  active,
  count,
  disabled = false,
  label,
  onClick,
  prefix,
}: {
  active: boolean;
  count: number;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  prefix: string;
}) {
  return (
    <button
      className="grid min-h-9 grid-cols-[24px_1fr_auto] items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[15px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent data-[active=true]:bg-[var(--color-accent-soft)] data-[active=true]:text-[var(--color-text-primary)] data-[active=true]:shadow-[inset_0_0_0_1px_var(--color-border-strong)]"
      data-active={active}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <span className="text-center text-lg font-bold leading-none text-[var(--color-accent)]">
        {prefix}
      </span>
      <span className="min-w-0 truncate">{label}</span>
      <span className="text-xs text-[var(--color-text-muted)]">{count}</span>
    </button>
  );
}

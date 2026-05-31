"use client";

import type { LucideIcon } from "lucide-react";

export type TrendPoint = { period: string; count: number };
export type Period = "weekly" | "monthly";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatPeriodLabel(p: string, period: Period): string {
  if (period === "monthly") {
    const [year, month] = p.split("-");
    return new Date(Number(year), Number(month) - 1, 1)
      .toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return new Date(p).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── BarChart ──────────────────────────────────────────────────────────────────

type BarColor = "blue" | "emerald" | "violet" | "amber" | "rose";
const BAR_COLORS: Record<BarColor, string> = {
  blue:    "bg-blue-500",
  emerald: "bg-emerald-500",
  violet:  "bg-violet-500",
  amber:   "bg-amber-500",
  rose:    "bg-rose-500",
};

export function BarChart({
  data,
  period,
  color = "blue",
  height = 28,
}: {
  data: TrendPoint[];
  period: Period;
  color?: BarColor;
  height?: number;
}) {
  if (!data.length)
    return <p className="text-xs text-[var(--text-muted)] py-6 text-center">No data yet</p>;

  const max = Math.max(...data.map((d) => d.count), 1);
  const bar = BAR_COLORS[color];
  const h   = `h-${height}`;

  return (
    <div className={`flex items-end gap-1.5 ${h} pt-2`}>
      {data.map((d) => (
        <div key={d.period} className="flex flex-col items-center flex-1 min-w-0 h-full justify-end">
          {d.count > 0 && (
            <span className="text-[10px] text-[var(--text-muted)] font-medium mb-0.5">{d.count}</span>
          )}
          <div
            className={`w-full rounded-t ${bar} transition-all`}
            style={{ height: `${Math.max((d.count / max) * 80, d.count > 0 ? 3 : 0)}%` }}
            title={`${formatPeriodLabel(d.period, period)}: ${d.count}`}
          />
          <span className="text-[9px] text-[var(--text-muted)] mt-1 truncate w-full text-center leading-tight">
            {formatPeriodLabel(d.period, period)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── MiniBarChart (for daily trend, no labels) ─────────────────────────────────

export function MiniBarChart({
  data,
  color = "blue",
}: {
  data: TrendPoint[];
  color?: BarColor;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const bar = BAR_COLORS[color];
  return (
    <div className="flex items-end gap-0.5 h-10">
      {data.map((d) => (
        <div
          key={d.period}
          className={`flex-1 rounded-sm ${bar} opacity-70`}
          style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 5 : 0)}%` }}
          title={`${d.period}: ${d.count}`}
        />
      ))}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

const ACCENT_ICON_COLORS: Record<string, string> = {
  blue:    "text-blue-600 bg-blue-50",
  emerald: "text-emerald-600 bg-emerald-50",
  violet:  "text-violet-600 bg-violet-50",
  amber:   "text-amber-600 bg-amber-50",
  rose:    "text-rose-600 bg-rose-50",
};

const ACCENT_BORDER: Record<string, string> = {
  blue:    "border-l-blue-500",
  emerald: "border-l-emerald-500",
  violet:  "border-l-violet-500",
  amber:   "border-l-amber-500",
  rose:    "border-l-rose-500",
};

export function StatCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "emerald" | "violet" | "amber" | "rose";
  icon?: LucideIcon;
}) {
  const border = accent ? `border-l-4 ${ACCENT_BORDER[accent]}` : "";
  const iconCls = accent ? ACCENT_ICON_COLORS[accent] : "text-slate-500 bg-slate-50";

  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 ${border}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
        {Icon && (
          <div className={`rounded-lg p-1.5 ${iconCls}`}>
            <Icon size={14} />
          </div>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold text-[var(--text-primary)] tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

// ── PeriodToggle ──────────────────────────────────────────────────────────────

export function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs font-medium" role="group" aria-label="Period selector">
      {(["weekly", "monthly"] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          aria-pressed={value === p}
          className={`px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-focus)] ${
            value === p
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
          }`}
        >
          {p === "weekly" ? "Weekly" : "Monthly"}
        </button>
      ))}
    </div>
  );
}

// ── ChartCard ─────────────────────────────────────────────────────────────────

export function ChartCard({
  title,
  period,
  onPeriodChange,
  children,
}: {
  title: string;
  period?: Period;
  onPeriodChange?: (p: Period) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {period && onPeriodChange && (
          <PeriodToggle value={period} onChange={onPeriodChange} />
        )}
      </div>
      {children}
    </div>
  );
}

// ── LeadPipelineFunnel ────────────────────────────────────────────────────────

type FunnelStep = { label: string; value: number; color: string };

export function LeadPipelineFunnel({ data }: { data: FunnelStep[] }) {
  const max = Math.max(...data.map((s) => s.value), 1);
  return (
    <div className="space-y-2">
      {data.map((step, i) => {
        const pct = Math.max((step.value / max) * 100, step.value > 0 ? 8 : 2);
        const convRate =
          i > 0 && data[i - 1].value > 0
            ? Math.round((step.value / data[i - 1].value) * 100)
            : null;
        return (
          <div key={step.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[var(--text-muted)]">{step.label}</span>
              <div className="flex items-center gap-2">
                {convRate !== null && (
                  <span className="text-[10px] text-[var(--text-muted)]">{convRate}% from prev</span>
                )}
                <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums w-10 text-right">
                  {step.value}
                </span>
              </div>
            </div>
            <div className="w-full bg-[var(--bg-subtle)] rounded-full h-5">
              <div
                className={`h-5 rounded-full ${step.color} transition-all flex items-center justify-end pe-2`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── DonutBreakdown (horizontal bar segments) ──────────────────────────────────

export function BreakdownBar({
  data,
  colors,
}: {
  data: Record<string, number>;
  colors?: Record<string, string>;
}) {
  const defaultColors = [
    "bg-blue-500", "bg-emerald-500", "bg-violet-500",
    "bg-amber-500", "bg-rose-500", "bg-gray-400",
  ];
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total   = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return <p className="text-xs text-[var(--text-muted)]">No data</p>;

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3" role="img" aria-label="Distribution chart">
        {entries.map(([k, v], i) => (
          <div
            key={k}
            className={colors?.[k] ?? defaultColors[i % defaultColors.length]}
            style={{ width: `${(v / total) * 100}%` }}
            title={`${k}: ${v}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {entries.map(([k, v], i) => (
          <div key={k} className="flex items-center gap-1.5">
            <div
              aria-hidden="true"
              className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${colors?.[k] ?? defaultColors[i % defaultColors.length]}`}
            />
            <span className="text-xs text-[var(--text-muted)] capitalize">{k.replace(/_/g, " ")}</span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

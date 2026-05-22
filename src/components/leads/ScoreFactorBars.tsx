import type { Lead } from "@/types";

const FACTORS = [
  { key: "intent",     label: "Intent",     max: 25 },
  { key: "budget",     label: "Budget",     max: 20 },
  { key: "location",   label: "Location",   max: 15 },
  { key: "engagement", label: "Engagement", max: 25 },
  { key: "recency",    label: "Recency",    max: 15 },
] as const;

type FactorKey = (typeof FACTORS)[number]["key"];
type Factors = NonNullable<Lead["score_factors"]>;

export function ScoreFactorBars({ factors }: { factors: Lead["score_factors"] }) {
  if (!factors || Object.keys(factors).length === 0) return null;
  const f = factors as Factors;
  return (
    <div className="space-y-2 w-full">
      {FACTORS.map(({ key, label, max }) => {
        const value = f[key as FactorKey] ?? 0;
        const pct = (value / max) * 100;
        const bar =
          pct >= 80 ? "bg-blue-500" : pct >= 50 ? "bg-blue-300" : "bg-gray-200";
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 tabular-nums w-10 text-right">
              {value}/{max}
            </span>
          </div>
        );
      })}
    </div>
  );
}

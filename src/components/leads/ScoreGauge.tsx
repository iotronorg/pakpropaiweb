export function ScoreGauge({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color = s >= 70 ? "#f59e0b" : s >= 40 ? "#60a5fa" : "#9ca3af";
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = (s / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={72} height={72} className="-rotate-90">
        <circle cx={36} cy={36} r={r} fill="none" stroke="#f3f4f6" strokeWidth={6} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="text-xl font-bold tabular-nums -mt-12 z-10 relative"
        style={{ color }}
      >
        {score ?? "—"}
      </span>
      <span className="text-xs text-gray-400 mt-8">Intent score</span>
    </div>
  );
}

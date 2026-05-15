interface BadgeProps {
  label:    string;
  variant?: "green" | "red" | "yellow" | "blue" | "gray" | "purple" | "teal";
}

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  green:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  red:    "bg-red-50 text-red-700 border border-red-200",
  yellow: "bg-amber-50 text-amber-700 border border-amber-200",
  blue:   "bg-sky-50 text-sky-700 border border-sky-200",
  gray:   "bg-slate-100 text-slate-600 border border-slate-200",
  purple: "bg-violet-50 text-violet-700 border border-violet-200",
  teal:   "bg-teal-50 text-teal-700 border border-teal-200",
};

export function Badge({ label, variant = "gray" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${variants[variant]}`}>
      {label}
    </span>
  );
}

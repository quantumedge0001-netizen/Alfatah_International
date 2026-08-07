import type { LucideIcon } from "lucide-react";

const TONES = {
  teal: { bg: "bg-[#e8f3f1]", text: "text-[#1f7a68]" },
  brass: { bg: "bg-[#fbf1e0]", text: "text-[#a67c2e]" },
  ink: { bg: "bg-[#eef0f4]", text: "text-ink" },
  warn: { bg: "bg-[#fdeceb]", text: "text-[#c0392b]" },
} as const;

export default function KpiCard({
  label,
  value,
  delta,
  warn,
  icon: Icon,
  tone = "ink",
}: {
  label: string;
  value: string;
  delta?: string;
  warn?: boolean;
  icon?: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[warn ? "warn" : tone];

  return (
    <div className="rounded-xl border border-line bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted">{label}</div>
        {Icon && (
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${t.bg} ${t.text}`}>
            <Icon size={17} />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight text-ink">{value}</div>
      {delta && (
        <div className={`mt-1.5 text-[12px] font-medium ${warn ? "text-[#c0392b]" : "text-muted"}`}>{delta}</div>
      )}
    </div>
  );
}
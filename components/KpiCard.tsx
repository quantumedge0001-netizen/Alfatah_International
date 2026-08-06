export default function KpiCard({
  label,
  value,
  delta,
  warn,
}: {
  label: string;
  value: string;
  delta?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wider text-muted">{label}</div>
      <div className="font-display text-2xl font-semibold tracking-tight">{value}</div>
      {delta && (
        <div className={`mt-1.5 text-xs font-medium ${warn ? "text-stamp" : "text-success"}`}>{delta}</div>
      )}
    </div>
  );
}

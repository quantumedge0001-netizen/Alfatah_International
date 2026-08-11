export default function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-[#072F5F]/20 bg-gradient-to-br from-[#072F5F] to-[#0a3d7a] p-6 text-white shadow-lg shadow-[#072F5F]/10 sm:p-8">
      {eyebrow && (
        <div className="text-[11.5px] font-medium uppercase tracking-widest text-[#58CCED]">{eyebrow}</div>
      )}
      <h1 className="mt-1.5 font-display text-[22px] font-bold tracking-tight text-white sm:text-[24px]">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-[13px] text-white/70">{subtitle}</p>}
    </div>
  );
}

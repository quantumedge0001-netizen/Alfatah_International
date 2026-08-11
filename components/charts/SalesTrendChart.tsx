"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function SalesTrendChart({ data }: { data: { month: string; total: number }[] }) {
  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[12.5px] text-muted">
        No dated sales data available yet — connect a <code className="mx-1">created_at</code> column on{" "}
        <code>sales</code> to power this chart.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#072F5F" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#072F5F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value) => [`Rs ${Number(value ?? 0).toLocaleString()}`, "Sales"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Area type="monotone" dataKey="total" stroke="#072F5F" strokeWidth={2} fill="url(#salesFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
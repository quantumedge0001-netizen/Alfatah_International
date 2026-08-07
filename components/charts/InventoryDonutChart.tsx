"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#1f7a68", "#c0392b"];

export default function InventoryDonutChart({ healthy, low }: { healthy: number; low: number }) {
  const total = healthy + low;
  const data = [
    { name: "Healthy Stock", value: healthy },
    { name: "Low Stock", value: low },
  ];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={65} outerRadius={95} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} stroke="none" />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-xl font-bold text-ink">{total > 0 ? Math.round((healthy / total) * 100) : 0}%</div>
        <div className="text-[10px] uppercase tracking-wide text-muted">Healthy</div>
      </div>
    </div>
  );
}
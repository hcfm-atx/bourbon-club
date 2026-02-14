"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BourbonRating {
  avgRating: number;
}

const COLORS = ["#dc2626", "#f97316", "#fbbf24", "#4ade80", "#16a34a"];

export function RatingDistributionChart({ data }: { data: BourbonRating[] }) {
  const ranges = [
    { label: "0-2", min: 0, max: 2 },
    { label: "2-4", min: 2, max: 4 },
    { label: "4-6", min: 4, max: 6 },
    { label: "6-8", min: 6, max: 8 },
    { label: "8-10", min: 8, max: 10 },
  ];

  const chartData = ranges.map((range) => ({
    range: range.label,
    count: data.filter((b) => b.avgRating >= range.min && b.avgRating < range.max).length,
  }));

  // Include the perfect 10s in the 8-10 range
  const perfectTens = data.filter((b) => b.avgRating === 10).length;
  chartData[4].count += perfectTens;

  if (chartData.every((d) => d.count === 0)) {
    return <p className="text-muted-foreground">No rating data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="range" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} />
        <Tooltip
          formatter={(value) => [`${value} bourbons`, "Count"]}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

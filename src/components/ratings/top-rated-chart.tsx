"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BourbonRating {
  name: string;
  avgRating: number;
  reviewCount: number;
}

const COLORS = ["#d97706", "#b45309", "#92400e", "#78350f", "#451a03", "#f59e0b", "#ea580c", "#c2410c", "#9a3412", "#7c2d12"];

export function TopRatedChart({ data }: { data: BourbonRating[] }) {
  const chartData = data
    .slice(0, 10)
    .map((b) => ({
      name: b.name.length > 25 ? b.name.slice(0, 25) + "..." : b.name,
      rating: parseFloat(b.avgRating.toFixed(1)),
      reviews: b.reviewCount,
    }));

  if (chartData.length === 0) {
    return <p className="text-muted-foreground">No ratings available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(350, chartData.length * 45)}>
      <BarChart data={chartData} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <XAxis type="number" domain={[0, 10]} />
        <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, _name: any, props: any) =>
            [`${value}/10 (${props?.payload?.reviews || 0} reviews)`, "Rating"]
          }
        />
        <Bar dataKey="rating" radius={[0, 4, 4, 0]}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

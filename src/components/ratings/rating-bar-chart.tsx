"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BourbonRating {
  name: string;
  avgRating: number;
  reviewCount: number;
}

const COLORS = ["#d97706", "#b45309", "#92400e", "#78350f", "#451a03"];

export function RatingBarChart({ data }: { data: BourbonRating[] }) {
  const chartData = data.slice(0, 15).map((b) => ({
    name: b.name.length > 20 ? b.name.slice(0, 20) + "..." : b.name,
    rating: parseFloat(b.avgRating.toFixed(1)),
    reviews: b.reviewCount,
  }));

  if (chartData.length === 0) return <p className="text-muted-foreground">No data to display.</p>;

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <XAxis type="number" domain={[0, 10]} />
        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, _name: any, props: any) =>
            [`${value}/10 (${props.payload.reviews} reviews)`, "Rating"]
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

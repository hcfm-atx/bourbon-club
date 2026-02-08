"use client";

import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis } from "recharts";

interface BourbonRating {
  name: string;
  avgRating: number;
  reviewCount: number;
  cost: number | null;
  proof: number | null;
}

export function RatingScatterPlot({ data, xAxis }: { data: BourbonRating[]; xAxis: "cost" | "proof" }) {
  const chartData = data
    .filter((b) => (xAxis === "cost" ? b.cost : b.proof) !== null)
    .map((b) => ({
      name: b.name,
      x: xAxis === "cost" ? b.cost! : b.proof!,
      rating: parseFloat(b.avgRating.toFixed(1)),
      reviews: b.reviewCount,
    }));

  if (chartData.length === 0) return <p className="text-muted-foreground">No data to display.</p>;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis
          type="number"
          dataKey="x"
          name={xAxis === "cost" ? "Cost ($)" : "Proof"}
          label={{ value: xAxis === "cost" ? "Cost ($)" : "Proof", position: "bottom" }}
        />
        <YAxis type="number" dataKey="rating" name="Rating" domain={[0, 10]} />
        <ZAxis type="number" dataKey="reviews" range={[50, 400]} name="Reviews" />
        <Tooltip
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-background border rounded-md p-2 shadow-md text-sm">
                <p className="font-medium">{d.name}</p>
                <p>{xAxis === "cost" ? `$${d.x}` : `${d.x}°`} — {d.rating}/10</p>
                <p className="text-muted-foreground">{d.reviews} reviews</p>
              </div>
            );
          }}
        />
        <Scatter data={chartData} fill="#d97706" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

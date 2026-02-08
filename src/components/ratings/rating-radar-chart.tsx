"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts";

interface BourbonRating {
  name: string;
  avgRating: number;
  proof: number | null;
  cost: number | null;
  age: number | null;
  reviewCount: number;
}

const COLORS = ["#d97706", "#2563eb", "#16a34a", "#dc2626"];

export function RatingRadarChart({ bourbons }: { bourbons: BourbonRating[] }) {
  if (bourbons.length === 0) return <p className="text-muted-foreground">Select bourbons to compare.</p>;

  // Normalize values to 0-100 scale
  const maxProof = Math.max(...bourbons.map((b) => b.proof || 0), 1);
  const maxCost = Math.max(...bourbons.map((b) => b.cost || 0), 1);
  const maxAge = Math.max(...bourbons.map((b) => b.age || 0), 1);

  const dimensions = ["Rating", "Proof", "Value", "Age", "Popularity"];

  const chartData = dimensions.map((dim) => {
    const entry: Record<string, string | number> = { dimension: dim };
    bourbons.forEach((b) => {
      let value = 0;
      switch (dim) {
        case "Rating": value = (b.avgRating / 10) * 100; break;
        case "Proof": value = ((b.proof || 0) / maxProof) * 100; break;
        case "Value": value = b.cost ? ((1 - (b.cost / maxCost)) * 50 + 50) : 50; break;
        case "Age": value = ((b.age || 0) / maxAge) * 100; break;
        case "Popularity": value = Math.min(b.reviewCount * 20, 100); break;
      }
      entry[b.name] = Math.round(value);
    });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} />
        {bourbons.map((b, i) => (
          <Radar
            key={b.name}
            name={b.name}
            dataKey={b.name}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.15}
          />
        ))}
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}

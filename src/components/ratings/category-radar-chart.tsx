"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CategoryRadarChart({ data }: { data: any[] }) {
  const categories = [
    { key: "appearanceScore", label: "Appearance" },
    { key: "noseScore", label: "Nose" },
    { key: "tasteScore", label: "Taste" },
    { key: "mouthfeelScore", label: "Mouthfeel" },
    { key: "finishScore", label: "Finish" },
  ];

  const chartData = categories.map((cat) => {
    const allScores = data
      .flatMap((b) => b.reviews)
      .map((r) => r[cat.key] as number | null | undefined)
      .filter((score): score is number => score != null);

    const avg = allScores.length > 0
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
      : 0;

    return {
      category: cat.label,
      score: parseFloat(avg.toFixed(2)),
    };
  });

  if (chartData.every((d) => d.score === 0)) {
    return <p className="text-muted-foreground">No category scores available yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
        <Radar
          name="Average Score"
          dataKey="score"
          stroke="#d97706"
          fill="#d97706"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

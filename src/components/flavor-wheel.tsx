"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Review {
  nose: string | null;
  palate: string | null;
  finish: string | null;
  notes: string | null;
  appearanceNotes: string | null;
  mouthfeel: string | null;
}

interface FlavorWheelProps {
  reviews: Review[];
}

const FLAVOR_CATEGORIES = {
  Sweet: ["vanilla", "caramel", "honey", "butterscotch", "toffee", "brown sugar", "maple", "molasses", "chocolate"],
  Fruity: ["cherry", "apple", "pear", "orange", "citrus", "berry", "dried fruit", "fig", "raisin", "plum", "peach"],
  Spicy: ["cinnamon", "pepper", "spice", "rye", "clove", "nutmeg", "ginger", "mint"],
  Woody: ["oak", "wood", "cedar", "char", "smoke", "tobacco", "leather", "pine"],
  Grain: ["corn", "wheat", "grain", "bread", "toast", "malt", "barley"],
  Other: ["floral", "herbal", "earthy", "nutty", "coffee", "tea", "grass", "mineral"],
};

const COLORS = ["#f59e0b", "#ef4444", "#10b981", "#78350f", "#fbbf24", "#6b7280"];

export function FlavorWheel({ reviews }: FlavorWheelProps) {
  // Extract all review text
  const allText = reviews
    .flatMap((r) => [r.nose, r.palate, r.finish, r.notes, r.appearanceNotes, r.mouthfeel])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!allText.trim()) {
    return null;
  }

  // Count flavor keywords by category
  const categoryCounts = Object.entries(FLAVOR_CATEGORIES).map(([category, keywords]) => {
    const count = keywords.filter((keyword) => allText.includes(keyword.toLowerCase())).length;
    return { category, count };
  });

  const chartData = categoryCounts.filter((d) => d.count > 0);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={(props: any) =>
              `${props.name || props.category} ${((props.percent || 0) * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} mentions`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center">
        Flavor profile based on review notes
      </p>
    </div>
  );
}

"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RatingTrendChart({ data }: { data: any[] }) {
  // Aggregate all reviews by month
  const reviewsByMonth = new Map<string, number[]>();

  data.forEach((bourbon) => {
    bourbon.reviews.forEach((review: { createdAt?: string; rating: number }) => {
      if (!review.createdAt) return;
      const date = new Date(review.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!reviewsByMonth.has(monthKey)) {
        reviewsByMonth.set(monthKey, []);
      }
      reviewsByMonth.get(monthKey)!.push(review.rating);
    });
  });

  // Calculate average rating per month
  const chartData = Array.from(reviewsByMonth.entries())
    .map(([month, ratings]) => ({
      month,
      avgRating: parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2)),
      count: ratings.length,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  if (chartData.length === 0) {
    return <p className="text-muted-foreground">No rating history available.</p>;
  }

  // Format month labels
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={{ fontSize: 11 }}
        />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
        <Tooltip
          labelFormatter={(label) => formatMonth(String(label))}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, _name: any, props: any) =>
            [`${value}/10 (${props?.payload?.count || 0} reviews)`, "Average Rating"]
          }
        />
        <Line
          type="monotone"
          dataKey="avgRating"
          stroke="#d97706"
          strokeWidth={2}
          dot={{ fill: "#d97706", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

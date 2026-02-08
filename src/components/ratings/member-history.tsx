"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ReviewData {
  rating: number;
  meetingDate?: string;
  meetingTitle?: string;
  userName: string;
}

interface BourbonRating {
  name: string;
  reviews: ReviewData[];
}

export function MemberHistory({ data }: { data: BourbonRating[] }) {
  // Flatten all reviews with dates and sort by date
  const allReviews = data
    .flatMap((b) =>
      b.reviews
        .filter((r) => r.meetingDate)
        .map((r) => ({
          date: new Date(r.meetingDate!).getTime(),
          dateLabel: new Date(r.meetingDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          rating: r.rating,
          bourbon: b.name,
          meeting: r.meetingTitle || "",
        }))
    )
    .sort((a, b) => a.date - b.date);

  if (allReviews.length === 0) return <p className="text-muted-foreground">No reviews yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={allReviews} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 10]} />
        <Tooltip
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-background border rounded-md p-2 shadow-md text-sm">
                <p className="font-medium">{d.bourbon}</p>
                <p>{d.rating}/10</p>
                <p className="text-muted-foreground">{d.meeting}</p>
              </div>
            );
          }}
        />
        <Line type="monotone" dataKey="rating" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

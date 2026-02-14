import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, ThumbsUp, ThumbsDown, GlassWater, Award } from "lucide-react";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);

  const clubId = session?.user?.id
    ? await getClubId(session.user.id, session.user.currentClubId)
    : null;

  if (!clubId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">No club selected.</p>
      </div>
    );
  }

  // Fetch reviews for the club with user and bourbon info
  const reviews = await prisma.review.findMany({
    where: { bourbon: { clubId } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      bourbon: { select: { id: true, name: true, distillery: true } },
    },
  });

  // Calculate member stats
  const memberReviewCounts = new Map<string, { name: string; count: number }>();
  const memberRatingSums = new Map<string, { name: string; sum: number; count: number }>();

  reviews.forEach((review) => {
    const userId = review.user.id;
    const userName = review.user.name || review.user.email || "Unknown";

    // Count reviews
    const reviewData = memberReviewCounts.get(userId) || { name: userName, count: 0 };
    reviewData.count += 1;
    memberReviewCounts.set(userId, reviewData);

    // Sum ratings
    const ratingData = memberRatingSums.get(userId) || { name: userName, sum: 0, count: 0 };
    ratingData.sum += review.rating;
    ratingData.count += 1;
    memberRatingSums.set(userId, ratingData);
  });

  // Top reviewers by count
  const topReviewers = Array.from(memberReviewCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate average ratings per member
  const memberAvgRatings = Array.from(memberRatingSums.entries()).map(([userId, data]) => ({
    userId,
    name: data.name,
    avgRating: data.sum / data.count,
    reviewCount: data.count,
  }));

  // Filter members with at least 3 reviews for meaningful stats
  const membersWithMinReviews = memberAvgRatings.filter((m) => m.reviewCount >= 3);

  // Highest average score (most generous)
  const mostGenerous = membersWithMinReviews.sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);

  // Lowest average score (harshest critic)
  const harshestCritics = membersWithMinReviews.sort((a, b) => a.avgRating - b.avgRating).slice(0, 5);

  // Calculate bourbon stats
  const bourbonStats = new Map<string, { name: string; distillery: string | null; sum: number; count: number }>();

  reviews.forEach((review) => {
    const bourbonId = review.bourbon.id;
    const stats = bourbonStats.get(bourbonId) || {
      name: review.bourbon.name,
      distillery: review.bourbon.distillery,
      sum: 0,
      count: 0,
    };
    stats.sum += review.rating;
    stats.count += 1;
    bourbonStats.set(bourbonId, stats);
  });

  const bourbonData = Array.from(bourbonStats.values()).map((stats) => ({
    name: stats.name,
    distillery: stats.distillery,
    avgRating: stats.sum / stats.count,
    reviewCount: stats.count,
  }));

  // Top-rated bourbon
  const topRatedBourbons = bourbonData
    .filter((b) => b.reviewCount >= 2) // At least 2 reviews for meaningful rating
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5);

  // Most reviewed bourbon
  const mostReviewedBourbons = bourbonData.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-amber-500" />
        <h1 className="text-3xl font-bold">Leaderboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Reviews Written */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-500" />
              Most Active Reviewers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topReviewers.length > 0 ? (
              <div className="space-y-3">
                {topReviewers.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          idx === 0
                            ? "bg-amber-500 text-white"
                            : idx === 1
                            ? "bg-gray-400 text-white"
                            : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <span className="text-sm font-bold text-purple-500">{member.count} reviews</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No reviews yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Most Generous Reviewers */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-500" />
              Most Generous Reviewers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostGenerous.length > 0 ? (
              <div className="space-y-3">
                {mostGenerous.map((member, idx) => (
                  <div key={member.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          idx === 0
                            ? "bg-amber-500 text-white"
                            : idx === 1
                            ? "bg-gray-400 text-white"
                            : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-500">{member.avgRating.toFixed(2)}/10</p>
                      <p className="text-xs text-muted-foreground">{member.reviewCount} reviews</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Need at least 3 reviews per member.</p>
            )}
          </CardContent>
        </Card>

        {/* Harshest Critics */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-500" />
              Harshest Critics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {harshestCritics.length > 0 ? (
              <div className="space-y-3">
                {harshestCritics.map((member, idx) => (
                  <div key={member.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          idx === 0
                            ? "bg-amber-500 text-white"
                            : idx === 1
                            ? "bg-gray-400 text-white"
                            : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-500">{member.avgRating.toFixed(2)}/10</p>
                      <p className="text-xs text-muted-foreground">{member.reviewCount} reviews</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Need at least 3 reviews per member.</p>
            )}
          </CardContent>
        </Card>

        {/* Top-Rated Bourbons */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Top-Rated Bourbons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topRatedBourbons.length > 0 ? (
              <div className="space-y-3">
                {topRatedBourbons.map((bourbon, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          idx === 0
                            ? "bg-amber-500 text-white"
                            : idx === 1
                            ? "bg-gray-400 text-white"
                            : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium">{bourbon.name}</p>
                        {bourbon.distillery && (
                          <p className="text-xs text-muted-foreground">{bourbon.distillery}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-500">{bourbon.avgRating.toFixed(2)}/10</p>
                      <p className="text-xs text-muted-foreground">{bourbon.reviewCount} reviews</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Need at least 2 reviews per bourbon.</p>
            )}
          </CardContent>
        </Card>

        {/* Most Reviewed Bourbons */}
        <Card className="border-l-4 border-l-blue-500 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GlassWater className="w-5 h-5 text-blue-500" />
              Most Reviewed Bourbons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostReviewedBourbons.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {mostReviewedBourbons.map((bourbon, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          idx === 0
                            ? "bg-amber-500 text-white"
                            : idx === 1
                            ? "bg-gray-400 text-white"
                            : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium">{bourbon.name}</p>
                        {bourbon.distillery && (
                          <p className="text-xs text-muted-foreground">{bourbon.distillery}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-500">{bourbon.reviewCount} reviews</p>
                      <p className="text-xs text-muted-foreground">Avg: {bourbon.avgRating.toFixed(2)}/10</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No reviews yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

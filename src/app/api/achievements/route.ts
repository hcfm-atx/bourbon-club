import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";

// Seed achievements if they don't exist
const ACHIEVEMENTS = [
  {
    key: "first_review",
    name: "First Pour",
    description: "Submit your first review",
    icon: "🥃",
    threshold: 1,
    category: "reviews",
  },
  {
    key: "10_reviews",
    name: "Critic",
    description: "Submit 10 reviews",
    icon: "⭐",
    threshold: 10,
    category: "reviews",
  },
  {
    key: "25_reviews",
    name: "Connoisseur",
    description: "Submit 25 reviews",
    icon: "🏆",
    threshold: 25,
    category: "reviews",
  },
  {
    key: "10_polls",
    name: "Social Butterfly",
    description: "Vote in 10 polls",
    icon: "🦋",
    threshold: 10,
    category: "social",
  },
  {
    key: "5_meetings",
    name: "Regular",
    description: "RSVP to 5 meetings",
    icon: "📅",
    threshold: 5,
    category: "meetings",
  },
  {
    key: "15_meetings",
    name: "Dedicated",
    description: "RSVP to 15 meetings",
    icon: "🎯",
    threshold: 15,
    category: "meetings",
  },
  {
    key: "5_suggestions",
    name: "Wishful Thinker",
    description: "Suggest 5 bourbons",
    icon: "💭",
    threshold: 5,
    category: "social",
  },
  {
    key: "10_suggestion_votes",
    name: "Trendsetter",
    description: "Get 10 votes on your suggestions",
    icon: "🔥",
    threshold: 10,
    category: "social",
  },
];

async function ensureAchievements() {
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: {},
      create: achievement,
    });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clubId = await getClubId(
      session.user.id,
      session.user.currentClubId
    );

    // Ensure achievements exist
    await ensureAchievements();

    // Get all achievements
    const achievements = await prisma.achievement.findMany({
      orderBy: [{ category: "asc" }, { threshold: "asc" }],
    });

    // Get user's earned achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      include: { achievement: true },
    });

    const earnedKeys = new Set(
      userAchievements.map((ua) => ua.achievement.key)
    );

    // Calculate progress for each achievement
    const [reviewCount, pollVoteCount, rsvpCount, suggestionCount, suggestionVotes] =
      await Promise.all([
        prisma.review.count({
          where: {
            userId: session.user.id,
            bourbon: { clubId: clubId ?? undefined },
          },
        }),
        prisma.pollVote.count({
          where: {
            userId: session.user.id,
            pollOption: { poll: { clubId: clubId ?? undefined } },
          },
        }),
        prisma.meetingRsvp.count({
          where: {
            userId: session.user.id,
            meeting: { clubId: clubId ?? undefined },
            status: { in: ["GOING", "MAYBE"] },
          },
        }),
        prisma.bourbonSuggestion.count({
          where: {
            userId: session.user.id,
            clubId: clubId ?? undefined,
          },
        }),
        prisma.suggestionVote.count({
          where: {
            suggestion: {
              userId: session.user.id,
              clubId: clubId ?? undefined,
            },
          },
        }),
      ]);

    const progressMap: Record<string, number> = {
      first_review: reviewCount,
      "10_reviews": reviewCount,
      "25_reviews": reviewCount,
      "10_polls": pollVoteCount,
      "5_meetings": rsvpCount,
      "15_meetings": rsvpCount,
      "5_suggestions": suggestionCount,
      "10_suggestion_votes": suggestionVotes,
    };

    const achievementsWithProgress = achievements.map((achievement) => {
      const earned = earnedKeys.has(achievement.key);
      const earnedDate = earned
        ? userAchievements.find((ua) => ua.achievement.key === achievement.key)
            ?.earnedAt
        : null;

      return {
        ...achievement,
        earned,
        earnedAt: earnedDate,
        progress: progressMap[achievement.key] || 0,
      };
    });

    return NextResponse.json(achievementsWithProgress);
  } catch (error) {
    console.error("Failed to fetch achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}

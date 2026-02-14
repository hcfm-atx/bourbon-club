import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: userId } = await params;

  try {
    const clubId = await getClubId(
      session.user.id,
      session.user.currentClubId
    );

    // Get all meetings with user's RSVP, ordered by date descending (most recent first)
    const meetingsWithRsvp = await prisma.meeting.findMany({
      where: {
        clubId: clubId ?? undefined,
        date: { lte: new Date() }, // Only past/current meetings
      },
      include: {
        rsvps: {
          where: { userId },
        },
      },
      orderBy: { date: "desc" },
    });

    // Calculate current streak (consecutive meetings attended from most recent)
    let currentStreak = 0;
    for (const meeting of meetingsWithRsvp) {
      const rsvp = meeting.rsvps[0];
      if (rsvp && (rsvp.status === "GOING" || rsvp.status === "MAYBE")) {
        currentStreak++;
      } else {
        break; // Streak broken
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    for (const meeting of meetingsWithRsvp.reverse()) {
      // Chronological order for longest
      const rsvp = meeting.rsvps[0];
      if (rsvp && (rsvp.status === "GOING" || rsvp.status === "MAYBE")) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Total meetings attended
    const totalAttended = await prisma.meetingRsvp.count({
      where: {
        userId,
        status: { in: ["GOING", "MAYBE"] },
        meeting: {
          clubId: clubId ?? undefined,
          date: { lte: new Date() },
        },
      },
    });

    // Total meetings
    const totalMeetings = await prisma.meeting.count({
      where: {
        clubId: clubId ?? undefined,
        date: { lte: new Date() },
      },
    });

    // Attendance percentage
    const attendancePercentage =
      totalMeetings > 0 ? (totalAttended / totalMeetings) * 100 : 0;

    return NextResponse.json({
      currentStreak,
      longestStreak,
      totalAttended,
      totalMeetings,
      attendancePercentage: Math.round(attendancePercentage),
    });
  } catch (error) {
    console.error("Failed to fetch streaks:", error);
    return NextResponse.json(
      { error: "Failed to fetch streaks" },
      { status: 500 }
    );
  }
}

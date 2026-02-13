import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  const { id } = await params;
  const { optionIds } = await req.json();
  const userId = session.user.id;

  // Verify poll exists, is open, and belongs to user's club
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: { options: true },
  });
  if (!poll || poll.status !== "OPEN" || poll.clubId !== clubId) {
    return NextResponse.json({ error: "Poll not available" }, { status: 400 });
  }

  // Remove existing votes for this user on this poll
  const optionIdsForPoll = poll.options.map((o) => o.id);
  await prisma.pollVote.deleteMany({
    where: { userId, pollOptionId: { in: optionIdsForPoll } },
  });

  // Create new votes
  if (optionIds.length > 0) {
    await prisma.pollVote.createMany({
      data: (optionIds as string[]).map((pollOptionId) => ({ pollOptionId, userId })),
    });
  }

  return NextResponse.json({ ok: true });
}

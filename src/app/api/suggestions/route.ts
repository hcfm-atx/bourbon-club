import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({ error: "No club selected" }, { status: 400 });

  const suggestions = await prisma.bourbonSuggestion.findMany({
    where: { clubId },
    include: {
      user: { select: { name: true, email: true } },
      votes: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = suggestions.map((s) => ({
    id: s.id,
    name: s.name,
    distillery: s.distillery,
    notes: s.notes,
    createdAt: s.createdAt,
    suggestedBy: s.user.name || s.user.email,
    voteCount: s.votes.length,
    userVoted: s.votes.some((v) => v.userId === session.user.id),
  }));

  // Sort by vote count descending
  enriched.sort((a, b) => b.voteCount - a.voteCount);

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({ error: "No club selected" }, { status: 400 });

  const { name, distillery, notes } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Bourbon name is required" }, { status: 400 });
  }

  const suggestion = await prisma.bourbonSuggestion.create({
    data: {
      name: name.trim(),
      distillery: distillery?.trim() || null,
      notes: notes?.trim() || null,
      userId: session.user.id,
      clubId,
    },
  });

  return NextResponse.json(suggestion);
}

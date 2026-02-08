import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const {
    bourbonId, meetingBourbonId,
    appearanceScore, appearanceNotes,
    noseScore, nose,
    tasteScore, palate,
    mouthfeelScore, mouthfeel,
    finishScore, finish,
    notes,
  } = await req.json();

  // Compute overall rating as average of 5 category scores
  const scores = [appearanceScore, noseScore, tasteScore, mouthfeelScore, finishScore];
  const validScores = scores.filter((s: number | null) => s != null) as number[];
  const rating = validScores.length > 0
    ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length
    : 0;

  if (meetingBourbonId) {
    const existing = await prisma.review.findUnique({
      where: { userId_meetingBourbonId: { userId: session.user.id, meetingBourbonId } },
    });
    if (existing) {
      return NextResponse.json({ error: "You already reviewed this bourbon at this meeting" }, { status: 400 });
    }
  } else {
    const existing = await prisma.review.findFirst({
      where: { userId: session.user.id, bourbonId, meetingBourbonId: { equals: null } },
    });
    if (existing) {
      return NextResponse.json({ error: "You already reviewed this bourbon" }, { status: 400 });
    }
  }

  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      bourbonId,
      meetingBourbonId: meetingBourbonId || null,
      rating,
      appearanceScore, appearanceNotes: appearanceNotes || null,
      noseScore, nose: nose || null,
      tasteScore, palate: palate || null,
      mouthfeelScore, mouthfeel: mouthfeel || null,
      finishScore, finish: finish || null,
      notes: notes || null,
    },
  });
  return NextResponse.json(review);
}

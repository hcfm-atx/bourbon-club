import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return NextResponse.json({}, { status: 404 });

  const isOwner = review.userId === session.user.id;
  if (!isOwner && !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const {
    appearanceScore, appearanceNotes,
    noseScore, nose,
    tasteScore, palate,
    mouthfeelScore, mouthfeel,
    finishScore, finish,
    notes,
  } = await req.json();

  const scores = [appearanceScore, noseScore, tasteScore, mouthfeelScore, finishScore];
  const validScores = scores.filter((s: number | null) => s != null) as number[];
  const rating = validScores.length > 0
    ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length
    : 0;

  const updated = await prisma.review.update({
    where: { id },
    data: {
      rating,
      appearanceScore, appearanceNotes: appearanceNotes || null,
      noseScore, nose: nose || null,
      tasteScore, palate: palate || null,
      mouthfeelScore, mouthfeel: mouthfeel || null,
      finishScore, finish: finish || null,
      notes: notes || null,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return NextResponse.json({}, { status: 404 });

  const isOwner = review.userId === session.user.id;
  if (!isOwner && !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

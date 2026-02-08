import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { bourbonId, meetingBourbonId, rating, nose, palate, finish, notes } = await req.json();

  // Check for existing review
  const existing = await prisma.review.findUnique({
    where: { userId_meetingBourbonId: { userId: session.user.id, meetingBourbonId } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already reviewed this bourbon at this meeting" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      bourbonId,
      meetingBourbonId,
      rating,
      nose,
      palate,
      finish,
      notes,
    },
  });
  return NextResponse.json(review);
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const suggestionId = params.id;

  const existing = await prisma.suggestionVote.findUnique({
    where: {
      suggestionId_userId: {
        suggestionId,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    // Remove vote
    await prisma.suggestionVote.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ voted: false });
  } else {
    // Add vote
    await prisma.suggestionVote.create({
      data: {
        suggestionId,
        userId: session.user.id,
      },
    });
    return NextResponse.json({ voted: true });
  }
}

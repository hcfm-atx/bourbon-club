import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_REACTION_TYPES = ["helpful", "agree", "interesting", "great"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reviewId } = await params;

  try {
    const reactions = await prisma.reviewReaction.findMany({
      where: { reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Group by type with counts and whether current user reacted
    const grouped = VALID_REACTION_TYPES.map((type) => {
      const typeReactions = reactions.filter((r) => r.type === type);
      return {
        type,
        count: typeReactions.length,
        userReacted: typeReactions.some((r) => r.userId === session.user.id),
      };
    });

    return NextResponse.json(grouped);
  } catch (error) {
    console.error("Failed to fetch reactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reviewId } = await params;

  try {
    const body = await req.json();
    const { type } = body;

    if (!VALID_REACTION_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 }
      );
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check if user already reacted with this type
    const existing = await prisma.reviewReaction.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      // Remove reaction if it exists
      await prisma.reviewReaction.delete({
        where: {
          reviewId_userId: {
            reviewId,
            userId: session.user.id,
          },
        },
      });

      return NextResponse.json({ action: "removed" });
    } else {
      // Add new reaction
      await prisma.reviewReaction.create({
        data: {
          reviewId,
          userId: session.user.id,
          type,
        },
      });

      return NextResponse.json({ action: "added" });
    }
  } catch (error) {
    console.error("Failed to toggle reaction:", error);
    return NextResponse.json(
      { error: "Failed to toggle reaction" },
      { status: 500 }
    );
  }
}

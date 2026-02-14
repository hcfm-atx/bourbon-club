import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids")?.split(",") || [];

  if (ids.length === 0) {
    return NextResponse.json([]);
  }

  const bourbons = await prisma.bourbon.findMany({
    where: {
      clubId,
      id: { in: ids }
    },
    include: {
      reviews: {
        select: {
          rating: true,
          appearanceScore: true,
          noseScore: true,
          tasteScore: true,
          mouthfeelScore: true,
          finishScore: true,
        }
      },
    },
  });

  const result = bourbons.map((b) => {
    const ratings = b.reviews.map((r) => r.rating);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : null;

    // Calculate category averages
    const calcAvg = (field: keyof typeof b.reviews[0]) => {
      const values = b.reviews.map(r => r[field]).filter((v): v is number => v !== null);
      return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
    };

    const categoryScores = {
      appearance: calcAvg("appearanceScore"),
      nose: calcAvg("noseScore"),
      taste: calcAvg("tasteScore"),
      mouthfeel: calcAvg("mouthfeelScore"),
      finish: calcAvg("finishScore"),
    };

    const valueScore = b.price && avgRating ? (avgRating / b.price) * 10 : null;

    return {
      id: b.id,
      name: b.name,
      distillery: b.distillery,
      proof: b.proof,
      price: b.price,
      cost: b.cost,
      age: b.age,
      type: b.type,
      avgRating,
      reviewCount: b.reviews.length,
      categoryScores,
      valueScore,
    };
  });

  return NextResponse.json(result);
}

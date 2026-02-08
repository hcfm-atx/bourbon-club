import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const params = req.nextUrl.searchParams;
  const distillery = params.get("distillery");
  const type = params.get("type");
  const minProof = params.get("minProof");
  const maxProof = params.get("maxProof");
  const minCost = params.get("minCost");
  const maxCost = params.get("maxCost");
  const region = params.get("region");
  const minAge = params.get("minAge");
  const maxAge = params.get("maxAge");
  const userId = params.get("userId");

  // Build bourbon filter
  const bourbonWhere: Record<string, unknown> = {};
  if (distillery) bourbonWhere.distillery = distillery;
  if (type) bourbonWhere.type = type;
  if (region) bourbonWhere.region = region;
  if (minProof || maxProof) {
    bourbonWhere.proof = {};
    if (minProof) (bourbonWhere.proof as Record<string, number>).gte = parseFloat(minProof);
    if (maxProof) (bourbonWhere.proof as Record<string, number>).lte = parseFloat(maxProof);
  }
  if (minCost || maxCost) {
    bourbonWhere.cost = {};
    if (minCost) (bourbonWhere.cost as Record<string, number>).gte = parseFloat(minCost);
    if (maxCost) (bourbonWhere.cost as Record<string, number>).lte = parseFloat(maxCost);
  }
  if (minAge || maxAge) {
    bourbonWhere.age = {};
    if (minAge) (bourbonWhere.age as Record<string, number>).gte = parseInt(minAge);
    if (maxAge) (bourbonWhere.age as Record<string, number>).lte = parseInt(maxAge);
  }

  const reviewWhere: Record<string, unknown> = {};
  if (userId) reviewWhere.userId = userId;

  const bourbons = await prisma.bourbon.findMany({
    where: bourbonWhere,
    include: {
      reviews: {
        where: reviewWhere,
        include: {
          user: { select: { id: true, name: true, email: true } },
          meetingBourbon: { include: { meeting: { select: { date: true, title: true } } } },
        },
      },
    },
  });

  const result = bourbons
    .filter((b) => b.reviews.length > 0)
    .map((b) => {
      const ratings = b.reviews.map((r) => r.rating);
      return {
        id: b.id,
        name: b.name,
        distillery: b.distillery,
        type: b.type,
        proof: b.proof,
        cost: b.cost,
        region: b.region,
        age: b.age,
        avgRating: ratings.reduce((a, c) => a + c, 0) / ratings.length,
        minRating: Math.min(...ratings),
        maxRating: Math.max(...ratings),
        reviewCount: ratings.length,
        reviews: b.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          nose: r.nose,
          palate: r.palate,
          finish: r.finish,
          notes: r.notes,
          userId: r.userId,
          userName: r.user.name || r.user.email,
          meetingDate: r.meetingBourbon?.meeting?.date,
          meetingTitle: r.meetingBourbon?.meeting?.title,
        })),
      };
    })
    .sort((a, b) => b.avgRating - a.avgRating);

  // Also return filter options
  const allBourbons = await prisma.bourbon.findMany({
    select: { distillery: true, type: true, region: true },
  });
  const filterOptions = {
    distilleries: [...new Set(allBourbons.map((b) => b.distillery).filter(Boolean))].sort(),
    types: [...new Set(allBourbons.map((b) => b.type))].sort(),
    regions: [...new Set(allBourbons.map((b) => b.region).filter(Boolean))].sort(),
  };

  return NextResponse.json({ bourbons: result, filterOptions });
}

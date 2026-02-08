import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const clubId = session.user.currentClubId;
  if (!clubId) return NextResponse.json([]);

  const bourbons = await prisma.bourbon.findMany({
    where: { clubId },
    include: {
      reviews: { select: { rating: true } },
    },
    orderBy: { name: "asc" },
  });

  const result = bourbons.map((b) => ({
    ...b,
    avgRating: b.reviews.length > 0
      ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length
      : null,
    reviewCount: b.reviews.length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({}, { status: 401 });
  }

  const clubId = session.user.currentClubId;
  if (!clubId) return NextResponse.json({ error: "No active club" }, { status: 400 });

  const data = await req.json();
  const bourbon = await prisma.bourbon.create({ data: { ...data, clubId } });
  return NextResponse.json(bourbon);
}

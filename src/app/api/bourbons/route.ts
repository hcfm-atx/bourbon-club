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
  const purchasedOnly = searchParams.get("purchased") === "true";

  const bourbons = await prisma.bourbon.findMany({
    where: { clubId, ...(purchasedOnly ? { purchased: true } : {}) },
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

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({ error: "No active club" }, { status: 400 });

  const { name, distillery, proof, cost, price, type, region, age, imageUrl } = await req.json();
  const bourbon = await prisma.bourbon.create({
    data: { name, distillery, proof, cost, price, type, region, age, imageUrl, clubId, createdById: session.user.id },
  });
  return NextResponse.json(bourbon);
}

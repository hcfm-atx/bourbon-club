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
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const bourbons = await prisma.bourbon.findMany({
    where: { clubId, ...(purchasedOnly ? { purchased: true } : {}) },
    include: {
      reviews: { select: { rating: true } },
    },
    orderBy: { name: "asc" },
    take: cursor ? limit + 1 : undefined,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  let nextCursor: string | null = null;
  if (cursor && bourbons.length > limit) {
    const nextItem = bourbons.pop();
    nextCursor = nextItem!.id;
  }

  const result = bourbons.map((b) => ({
    ...b,
    avgRating: b.reviews.length > 0
      ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length
      : null,
    reviewCount: b.reviews.length,
  }));

  return NextResponse.json({ bourbons: result, nextCursor });
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

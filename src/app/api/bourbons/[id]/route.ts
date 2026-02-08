import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const { id } = await params;
  const bourbon = await prisma.bourbon.findUnique({
    where: { id },
    include: {
      reviews: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      meetings: {
        include: { meeting: { select: { id: true, title: true, date: true } } },
      },
    },
  });
  if (!bourbon) return NextResponse.json({}, { status: 404 });

  const avgRating = bourbon.reviews.length > 0
    ? bourbon.reviews.reduce((sum, r) => sum + r.rating, 0) / bourbon.reviews.length
    : null;

  return NextResponse.json({ ...bourbon, avgRating, reviewCount: bourbon.reviews.length });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const { id } = await params;
  const bourbon = await prisma.bourbon.findUnique({ where: { id } });
  if (!bourbon) return NextResponse.json({}, { status: 404 });

  const isOwner = bourbon.createdById === session.user.id;
  if (!isOwner && !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  // Only admins can toggle purchased status
  const data = await req.json();
  if (data.purchased !== undefined && !isClubAdmin(session)) {
    delete data.purchased;
  }

  const updated = await prisma.bourbon.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const { id } = await params;
  const bourbon = await prisma.bourbon.findUnique({ where: { id } });
  if (!bourbon) return NextResponse.json({}, { status: 404 });

  const isOwner = bourbon.createdById === session.user.id;
  if (!isOwner && !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  await prisma.bourbon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

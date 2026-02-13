import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin, getClubId } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  const { id } = await params;

  // Verify payment belongs to user's club via dues period
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { duesPeriod: { select: { clubId: true } } },
  });
  if (!payment || payment.duesPeriod.clubId !== clubId) return NextResponse.json({}, { status: 404 });

  const { paid } = await req.json();
  const updated = await prisma.payment.update({
    where: { id },
    data: {
      paid,
      paidAt: paid ? new Date() : null,
      method: paid ? "manual" : null,
    },
  });
  return NextResponse.json(updated);
}

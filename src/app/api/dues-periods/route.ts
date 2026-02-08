import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin, getClubId } from "@/lib/session";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json([]);

  const periods = await prisma.duesPeriod.findMany({
    where: { clubId },
    include: {
      payments: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { dueDate: "desc" },
  });
  return NextResponse.json(periods);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({ error: "No active club" }, { status: 400 });

  const { name, amount, dueDate, frequency } = await req.json();

  // Create the dues period
  const period = await prisma.duesPeriod.create({
    data: { clubId, name, amount, dueDate: new Date(dueDate), frequency },
  });

  // Auto-generate payment records for club members
  const members = await prisma.clubMember.findMany({
    where: { clubId },
    select: { userId: true },
  });
  await prisma.payment.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      duesPeriodId: period.id,
    })),
  });

  return NextResponse.json(period);
}

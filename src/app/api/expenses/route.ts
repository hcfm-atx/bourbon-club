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

  const expenses = await prisma.expense.findMany({
    where: { clubId },
    include: { recordedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({ error: "No active club" }, { status: 400 });

  const { description, amount, date, category, notes } = await req.json();

  const expense = await prisma.expense.create({
    data: {
      clubId,
      description,
      amount,
      date: new Date(date),
      category: category || null,
      notes: notes || null,
      recordedById: session.user.id,
    },
    include: { recordedBy: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(expense);
}

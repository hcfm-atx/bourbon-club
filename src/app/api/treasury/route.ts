import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({ totalCollected: 0, totalExpenses: 0, balance: 0, recentExpenses: [] });

  const [paidPayments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: { paid: true, duesPeriod: { clubId } },
      include: { duesPeriod: { select: { amount: true } } },
    }),
    prisma.expense.findMany({
      where: { clubId },
      orderBy: { date: "desc" },
      include: { recordedBy: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  const totalCollected = paidPayments.reduce((sum, p) => sum + p.duesPeriod.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({
    totalCollected,
    totalExpenses,
    balance: totalCollected - totalExpenses,
    recentExpenses: expenses.slice(0, 10),
  });
}

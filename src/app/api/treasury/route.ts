import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const [paidPayments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: { paid: true },
      include: { duesPeriod: { select: { amount: true } } },
    }),
    prisma.expense.findMany({
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

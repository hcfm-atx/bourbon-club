import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const expenses = await prisma.expense.findMany({
    include: { recordedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { description, amount, date, category, notes } = await req.json();

  const expense = await prisma.expense.create({
    data: {
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

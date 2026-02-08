import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const periods = await prisma.duesPeriod.findMany({
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
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { name, amount, dueDate, frequency } = await req.json();

  // Create the dues period
  const period = await prisma.duesPeriod.create({
    data: { name, amount, dueDate: new Date(dueDate), frequency },
  });

  // Auto-generate payment records for all members
  const members = await prisma.user.findMany({ select: { id: true } });
  await prisma.payment.createMany({
    data: members.map((m) => ({
      userId: m.id,
      duesPeriodId: period.id,
    })),
  });

  return NextResponse.json(period);
}

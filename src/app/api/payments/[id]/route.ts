import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const { id } = await params;
  const { paid } = await req.json();

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      paid,
      paidAt: paid ? new Date() : null,
      method: paid ? "manual" : null,
    },
  });
  return NextResponse.json(payment);
}

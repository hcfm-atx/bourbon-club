import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json([], { status: 403 });
  }

  const members = await prisma.user.findMany({
    select: { id: true, email: true, name: true, phone: true, role: true, smsOptIn: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(members);
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const { id } = await params;
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: {
        include: { votes: { include: { user: { select: { id: true, name: true, email: true } } } } },
        orderBy: { date: "asc" },
      },
    },
  });
  if (!poll) return NextResponse.json({}, { status: 404 });
  return NextResponse.json(poll);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { id } = await params;
  await prisma.poll.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

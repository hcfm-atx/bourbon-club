import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      bourbons: {
        include: {
          bourbon: true,
          reviews: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      },
    },
  });
  if (!meeting) return NextResponse.json({}, { status: 404 });
  return NextResponse.json(meeting);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { id } = await params;
  const data = await req.json();
  if (data.date) data.date = new Date(data.date);
  const meeting = await prisma.meeting.update({ where: { id }, data });
  return NextResponse.json(meeting);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { id } = await params;
  await prisma.meeting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

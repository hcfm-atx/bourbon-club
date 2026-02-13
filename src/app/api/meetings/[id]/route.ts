import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin, getClubId } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      bourbons: {
        include: {
          bourbon: true,
          reviews: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });
  if (!meeting || meeting.clubId !== clubId) return NextResponse.json({}, { status: 404 });
  return NextResponse.json(meeting);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  const { id } = await params;
  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing || existing.clubId !== clubId) return NextResponse.json({}, { status: 404 });

  const { title, date, location, notes } = await req.json();
  const data: Record<string, unknown> = { title, location, notes };
  if (date) data.date = new Date(date + "T12:00:00Z");

  const meeting = await prisma.meeting.update({ where: { id }, data });
  return NextResponse.json(meeting);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  const { id } = await params;
  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing || existing.clubId !== clubId) return NextResponse.json({}, { status: 404 });

  await prisma.meeting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

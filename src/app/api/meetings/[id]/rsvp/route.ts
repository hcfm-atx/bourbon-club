import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  const { id } = await params;

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting || meeting.clubId !== clubId) return NextResponse.json([], { status: 404 });

  const rsvps = await prisma.meetingRsvp.findMany({
    where: { meetingId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(rsvps);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  const { id } = await params;

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting || meeting.clubId !== clubId) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const { status } = await req.json();
  if (!["GOING", "MAYBE", "NOT_GOING"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const rsvp = await prisma.meetingRsvp.upsert({
    where: {
      meetingId_userId: {
        meetingId: id,
        userId: session.user.id,
      },
    },
    create: {
      meetingId: id,
      userId: session.user.id,
      status,
    },
    update: {
      status,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(rsvp);
}

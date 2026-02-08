import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin, getClubId } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({}, { status: 400 });

  const { id: userId } = await params;
  const { role } = await req.json();

  const member = await prisma.clubMember.update({
    where: { userId_clubId: { userId, clubId } },
    data: { role },
  });
  return NextResponse.json(member);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({}, { status: 400 });

  const { id: userId } = await params;
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  await prisma.clubMember.delete({
    where: { userId_clubId: { userId, clubId } },
  });

  // If this was the user's current club, clear it
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.currentClubId === clubId) {
    const nextClub = await prisma.clubMember.findFirst({
      where: { userId },
      select: { clubId: true },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { currentClubId: nextClub?.clubId || null },
    });
  }

  return NextResponse.json({ ok: true });
}

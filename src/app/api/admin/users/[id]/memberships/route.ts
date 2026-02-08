import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { id: userId } = await params;
  const { clubId, role } = await req.json();

  const existing = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId, clubId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 400 });
  }

  const membership = await prisma.clubMember.create({
    data: { userId, clubId, role: role || "MEMBER" },
  });

  // Set as current club if user doesn't have one
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { currentClubId: true } });
  if (!user?.currentClubId) {
    await prisma.user.update({ where: { id: userId }, data: { currentClubId: clubId } });
  }

  return NextResponse.json(membership);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { id: userId } = await params;
  const { clubId, role } = await req.json();

  const membership = await prisma.clubMember.update({
    where: { userId_clubId: { userId, clubId } },
    data: { role },
  });
  return NextResponse.json(membership);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { id: userId } = await params;
  const { clubId } = await req.json();

  await prisma.clubMember.delete({
    where: { userId_clubId: { userId, clubId } },
  });

  // If this was user's current club, reassign
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { currentClubId: true } });
  if (user?.currentClubId === clubId) {
    const next = await prisma.clubMember.findFirst({ where: { userId }, select: { clubId: true } });
    await prisma.user.update({ where: { id: userId }, data: { currentClubId: next?.clubId || null } });
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      invites: true,
      _count: { select: { bourbons: true, meetings: true } },
    },
  });
  if (!club) return NextResponse.json({}, { status: 404 });
  return NextResponse.json(club);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { id } = await params;

  // Only SUPER_ADMIN or club ADMIN can edit
  if (session.user.systemRole !== "SUPER_ADMIN") {
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId: id } },
    });
    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json({}, { status: 403 });
    }
  }

  const { name, description } = await req.json();
  const club = await prisma.club.update({
    where: { id },
    data: { name, description: description || null },
  });
  return NextResponse.json(club);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { id } = await params;
  await prisma.club.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

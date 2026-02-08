import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { id: clubId } = await params;
  const { userId } = await req.json();

  // Only club ADMIN or SUPER_ADMIN can remove members
  if (session.user.systemRole !== "SUPER_ADMIN") {
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
    });
    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json({}, { status: 403 });
    }
  }

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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { id: clubId, inviteId } = await params;

  // Only club ADMIN or SUPER_ADMIN can revoke invites
  if (session.user.systemRole !== "SUPER_ADMIN") {
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
    });
    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  // Verify the invite exists and belongs to the correct club
  const invite = await prisma.clubInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.clubId !== clubId) {
    return NextResponse.json({ error: "Invite does not belong to this club" }, { status: 400 });
  }

  // Delete the invite
  await prisma.clubInvite.delete({
    where: { id: inviteId },
  });

  return NextResponse.json({ success: true });
}

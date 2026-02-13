import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  // Only return clubs the user has been invited to
  const invites = await prisma.clubInvite.findMany({
    where: { email: session.user.email! },
    select: { clubId: true },
  });
  const invitedClubIds = invites.map((i) => i.clubId);

  if (invitedClubIds.length === 0) return NextResponse.json([]);

  const clubs = await prisma.club.findMany({
    where: { id: { in: invitedClubIds } },
    include: { _count: { select: { members: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(clubs);
}

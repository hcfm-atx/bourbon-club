import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  // Get clubs the user has been invited to
  const invites = await prisma.clubInvite.findMany({
    where: { email: session.user.email! },
    select: { clubId: true },
  });
  const invitedClubIds = invites.map((i) => i.clubId);

  // Return public clubs OR invited clubs
  const clubs = await prisma.club.findMany({
    where: {
      OR: [
        { isPublic: true },
        ...(invitedClubIds.length > 0 ? [{ id: { in: invitedClubIds } }] : []),
      ],
    },
    include: { _count: { select: { members: true } } },
    orderBy: { name: "asc" },
  });

  // Tag each club with whether the user was invited
  const invitedSet = new Set(invitedClubIds);
  const result = clubs.map((club) => ({
    ...club,
    invited: invitedSet.has(club.id),
  }));

  return NextResponse.json(result);
}

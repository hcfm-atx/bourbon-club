import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { joinClubIds, newClub } = await req.json();

  if ((!joinClubIds || joinClubIds.length === 0) && !newClub?.name) {
    return NextResponse.json({ error: "Must join or create at least one club" }, { status: 400 });
  }

  let firstClubId: string | null = null;

  // Create new club if requested
  if (newClub?.name) {
    const slug = newClub.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await prisma.club.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A club with a similar name already exists" }, { status: 400 });
    }

    const club = await prisma.club.create({
      data: {
        name: newClub.name,
        slug,
        settings: { create: { clubName: newClub.name } },
      },
    });

    await prisma.clubMember.create({
      data: { userId: session.user.id, clubId: club.id, role: "ADMIN" },
    });

    firstClubId = club.id;
  }

  // Join existing clubs — allow if public or user has a pending invite
  if (joinClubIds?.length > 0) {
    const invites = await prisma.clubInvite.findMany({
      where: { email: session.user.email! },
      select: { clubId: true },
    });
    const invitedClubIds = new Set(invites.map((i) => i.clubId));

    for (const clubId of joinClubIds) {
      const club = await prisma.club.findUnique({
        where: { id: clubId },
        select: { isPublic: true },
      });
      if (!club) continue;

      // Must be public or invited
      if (!club.isPublic && !invitedClubIds.has(clubId)) continue;

      const alreadyMember = await prisma.clubMember.findUnique({
        where: { userId_clubId: { userId: session.user.id, clubId } },
      });
      if (!alreadyMember) {
        await prisma.clubMember.create({
          data: { userId: session.user.id, clubId, role: "MEMBER" },
        });
      }
      if (!firstClubId) firstClubId = clubId;
    }
  }

  // Set current club
  if (firstClubId) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { currentClubId: firstClubId },
    });
  }

  return NextResponse.json({ ok: true, currentClubId: firstClubId });
}

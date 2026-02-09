import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin, getClubId } from "@/lib/session";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json([]);

  const polls = await prisma.poll.findMany({
    where: { clubId },
    include: {
      options: {
        include: {
          votes: true,
          bourbon: { select: { id: true, name: true, distillery: true, proof: true, type: true, imageUrl: true } },
        },
        orderBy: { date: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(polls);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({ error: "No active club" }, { status: 400 });

  const body = await req.json();
  const { title, type } = body;

  if (type === "BOURBON") {
    const { bourbonIds } = body as { bourbonIds: string[] };
    const bourbons = await prisma.bourbon.findMany({
      where: { id: { in: bourbonIds }, clubId, purchased: true },
    });
    if (bourbons.length === 0) {
      return NextResponse.json({ error: "No valid purchased bourbons selected" }, { status: 400 });
    }
    const poll = await prisma.poll.create({
      data: {
        clubId,
        title,
        type: "BOURBON",
        options: {
          create: bourbons.map((b) => ({ bourbonId: b.id, label: b.name })),
        },
      },
      include: { options: true },
    });
    return NextResponse.json(poll);
  }

  // Default: DATE poll
  const { dates } = body;
  const poll = await prisma.poll.create({
    data: {
      clubId,
      title,
      options: {
        create: (dates as string[]).map((date) => ({ date: new Date(date + "T12:00:00Z") })),
      },
    },
    include: { options: true },
  });
  return NextResponse.json(poll);
}

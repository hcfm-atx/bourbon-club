import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  if (session.user.systemRole === "SUPER_ADMIN") {
    const clubs = await prisma.club.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(clubs);
  }

  const memberships = await prisma.clubMember.findMany({
    where: { userId: session.user.id },
    include: {
      club: {
        include: { _count: { select: { members: true } } },
      },
    },
  });
  return NextResponse.json(memberships.map((m) => ({ ...m.club, myRole: m.role })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { name, description } = await req.json();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const existing = await prisma.club.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A club with a similar name already exists" }, { status: 400 });
  }

  const club = await prisma.club.create({
    data: {
      name,
      slug,
      description: description || null,
      settings: { create: { clubName: name } },
    },
  });

  return NextResponse.json(club);
}

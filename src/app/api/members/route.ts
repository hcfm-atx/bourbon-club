import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin } from "@/lib/session";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json([], { status: 403 });
  }

  const clubId = session.user.currentClubId;
  if (!clubId) return NextResponse.json([]);

  const members = await prisma.clubMember.findMany({
    where: { clubId },
    include: {
      user: { select: { id: true, email: true, name: true, phone: true, smsOptIn: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members.map((m) => ({
    id: m.user.id,
    email: m.user.email,
    name: m.user.name,
    phone: m.user.phone,
    smsOptIn: m.user.smsOptIn,
    role: m.role,
    memberId: m.id,
  })));
}

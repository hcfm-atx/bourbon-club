import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json([], { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      systemRole: true,
      memberships: {
        include: { club: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { userId } = await req.json();
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  // Delete all related data
  await prisma.clubMember.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}

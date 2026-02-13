import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin, getClubId } from "@/lib/session";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  const { id } = await params;

  const existing = await prisma.duesPeriod.findUnique({ where: { id } });
  if (!existing || existing.clubId !== clubId) return NextResponse.json({}, { status: 404 });

  await prisma.duesPeriod.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

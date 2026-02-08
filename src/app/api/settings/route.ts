import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin, getClubId } from "@/lib/session";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({ clubName: "Bourbon Club", reminderDaysBefore: 7 });

  const settings = await prisma.appSettings.findUnique({ where: { clubId } });
  return NextResponse.json(settings || { clubName: "Bourbon Club", reminderDaysBefore: 7 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({ error: "No active club" }, { status: 400 });

  const data = await req.json();
  const settings = await prisma.appSettings.upsert({
    where: { clubId },
    update: data,
    create: { clubId, ...data },
  });
  return NextResponse.json(settings);
}

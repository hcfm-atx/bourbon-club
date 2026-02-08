import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";
import { isClubAdmin } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = session.user.currentClubId;
  if (!clubId) return NextResponse.json({ error: "No active club" }, { status: 400 });

  const { message } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Only send to club members who have opted in
  const members = await prisma.clubMember.findMany({
    where: { clubId },
    include: { user: { select: { phone: true, smsOptIn: true } } },
  });

  const phones = members
    .filter((m) => m.user.smsOptIn && m.user.phone)
    .map((m) => m.user.phone!);

  await Promise.allSettled(phones.map((phone) => sendSMS(phone, message)));

  return NextResponse.json({ sent: phones.length });
}

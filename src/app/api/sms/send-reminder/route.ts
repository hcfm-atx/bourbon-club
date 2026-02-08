import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { message } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { smsOptIn: true, phone: { not: null } },
    select: { phone: true },
  });

  const phones = users.map((u) => u.phone!);
  await Promise.allSettled(phones.map((phone) => sendSMS(phone, message)));

  return NextResponse.json({ sent: phones.length });
}

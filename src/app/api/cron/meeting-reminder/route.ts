import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMeetingReminder } from "@/lib/twilio";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
  const reminderDays = settings?.reminderDaysBefore || 7;

  const now = new Date();
  const reminderDate = new Date(now);
  reminderDate.setDate(reminderDate.getDate() + reminderDays);

  // Find meetings within the reminder window that haven't been reminded
  const meetings = await prisma.meeting.findMany({
    where: {
      date: { gte: now, lte: reminderDate },
      reminderSentAt: null,
    },
  });

  if (meetings.length === 0) {
    return NextResponse.json({ message: "No meetings to remind about" });
  }

  // Get opted-in users
  const users = await prisma.user.findMany({
    where: { smsOptIn: true, phone: { not: null } },
    select: { phone: true },
  });

  const phones = users.map((u) => u.phone!);

  for (const meeting of meetings) {
    await sendMeetingReminder(phones, meeting.title, meeting.date, meeting.location);
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { reminderSentAt: new Date() },
    });
  }

  return NextResponse.json({
    message: `Sent reminders for ${meetings.length} meeting(s) to ${phones.length} member(s)`,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMeetingReminder } from "@/lib/twilio";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Iterate over all clubs
  const clubs = await prisma.club.findMany({
    include: { settings: true },
  });

  let totalMeetings = 0;
  let totalPhones = 0;

  for (const club of clubs) {
    const reminderDays = club.settings?.reminderDaysBefore || 7;
    const now = new Date();
    const reminderDate = new Date(now);
    reminderDate.setDate(reminderDate.getDate() + reminderDays);

    // Find meetings within the reminder window that haven't been reminded
    const meetings = await prisma.meeting.findMany({
      where: {
        clubId: club.id,
        date: { gte: now, lte: reminderDate },
        reminderSentAt: null,
      },
    });

    if (meetings.length === 0) continue;

    // Get opted-in club members
    const members = await prisma.clubMember.findMany({
      where: { clubId: club.id },
      include: { user: { select: { phone: true, smsOptIn: true } } },
    });

    const phones = members
      .filter((m) => m.user.smsOptIn && m.user.phone)
      .map((m) => m.user.phone!);

    for (const meeting of meetings) {
      await sendMeetingReminder(phones, meeting.title, meeting.date, meeting.location);
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { reminderSentAt: new Date() },
      });
    }

    totalMeetings += meetings.length;
    totalPhones += phones.length;
  }

  return NextResponse.json({
    message: `Sent reminders for ${totalMeetings} meeting(s) across ${clubs.length} club(s) to ${totalPhones} member(s)`,
  });
}

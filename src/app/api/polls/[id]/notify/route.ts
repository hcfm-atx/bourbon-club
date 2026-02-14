import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin, getClubId } from "@/lib/session";
import { sendSMS } from "@/lib/twilio";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json({ error: "No active club" }, { status: 400 });

  const { id } = await params;

  // Rate limit: max 3 notifications per poll per hour
  const { success } = rateLimit(`poll-notify:${id}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 });
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }
  const poll = await prisma.poll.findUnique({ where: { id } });
  if (!poll || poll.clubId !== clubId) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }
  if (poll.status !== "OPEN") {
    return NextResponse.json({ error: "Poll is not open" }, { status: 400 });
  }

  const members = await prisma.clubMember.findMany({
    where: { clubId },
    include: { user: { select: { email: true, phone: true, smsOptIn: true } } },
  });

  const pollUrl = `${process.env.NEXTAUTH_URL}/polls/${id}`;
  const smsBody = `New poll: "${poll.title}" — Vote now: ${pollUrl}`;

  const smsMembers = members.filter((m) => m.user.smsOptIn && m.user.phone);
  const emailMembers = members.filter((m) => !(m.user.smsOptIn && m.user.phone));

  await Promise.allSettled(
    smsMembers.map((m) => sendSMS(m.user.phone!, smsBody))
  );

  const emailSubject = `New Poll: ${poll.title}`;
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #92400e;">New Poll</h2>
      <p>A new poll has been created: <strong>${poll.title}</strong></p>
      <p>Cast your vote now:</p>
      <a href="${pollUrl}" style="display: inline-block; background: #b45309; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Vote Now</a>
    </div>
  `;

  await Promise.allSettled(
    emailMembers.map((m) => sendEmail(m.user.email, emailSubject, emailHtml))
  );

  return NextResponse.json({ sms: smsMembers.length, email: emailMembers.length });
}

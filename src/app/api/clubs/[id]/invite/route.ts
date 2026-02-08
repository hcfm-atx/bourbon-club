import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { id: clubId } = await params;

  // Only club ADMIN or SUPER_ADMIN can invite
  if (session.user.systemRole !== "SUPER_ADMIN") {
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
    });
    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json({}, { status: 403 });
    }
  }

  const { email, role, phone } = await req.json();

  if (!email && !phone) {
    return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
  }

  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { name: true } });
  const clubName = club?.name || "Bourbon Club";

  // If email provided, use full invite flow
  if (email) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.clubMember.findUnique({
        where: { userId_clubId: { userId: existingUser.id, clubId } },
      });
      if (existingMember) {
        return NextResponse.json({ error: "User is already a member of this club" }, { status: 400 });
      }
      await prisma.clubMember.create({
        data: { userId: existingUser.id, clubId, role: role || "MEMBER" },
      });
      if (!existingUser.currentClubId) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { currentClubId: clubId },
        });
      }

      const notifyPhone = phone || existingUser.phone;
      if (notifyPhone) {
        await sendSMS(notifyPhone, `You've been added to ${clubName}! Log in to check it out.`).catch(() => {});
      }

      return NextResponse.json({ added: true });
    }

    // Create invite for non-existing user
    const existingInvite = await prisma.clubInvite.findUnique({
      where: { clubId_email: { clubId, email } },
    });
    if (existingInvite) {
      return NextResponse.json({ error: "Invite already sent" }, { status: 400 });
    }

    const invite = await prisma.clubInvite.create({
      data: { clubId, email, role: role || "MEMBER" },
    });

    if (phone) {
      await sendSMS(phone, `You've been invited to join ${clubName}! Sign up with your email (${email}) to get started.`).catch(() => {});
    }

    return NextResponse.json(invite);
  }

  // Phone-only invite — just send SMS
  await sendSMS(phone, `You've been invited to join ${clubName}! Go to the site and sign up to get started.`).catch(() => {});

  return NextResponse.json({ smsSent: true });
}

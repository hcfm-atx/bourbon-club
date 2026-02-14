import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { id: clubId, inviteId } = await params;

  // Only club ADMIN or SUPER_ADMIN can resend invites
  if (session.user.systemRole !== "SUPER_ADMIN") {
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
    });
    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  // Verify the invite exists and belongs to the correct club
  const invite = await prisma.clubInvite.findUnique({
    where: { id: inviteId },
    include: {
      club: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.clubId !== clubId) {
    return NextResponse.json({ error: "Invite does not belong to this club" }, { status: 400 });
  }

  // Send the invitation email
  const clubName = invite.club.name || "Bourbon Club";
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    await sendEmail(
      invite.email,
      `You're invited to join ${clubName}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join ${clubName}</h2>
          <p>You've been invited to join <strong>${clubName}</strong> as a ${invite.role.toLowerCase()}.</p>
          <p>Click the link below to sign up and join the club:</p>
          <p>
            <a href="${baseUrl}/auth/signin" style="display: inline-block; padding: 12px 24px; background-color: #d97706; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Sign Up & Join
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            Make sure to sign up with this email address: <strong>${invite.email}</strong>
          </p>
        </div>
      `
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

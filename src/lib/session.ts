import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

/**
 * Get session and ensure currentClubId is set.
 * If the JWT has a stale/null currentClubId but the user has memberships,
 * auto-resolve it from the DB.
 */
export async function getClubId(userId: string, sessionClubId: string | null): Promise<string | null> {
  if (sessionClubId) return sessionClubId;

  // Fallback: look up from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentClubId: true },
  });
  if (user?.currentClubId) return user.currentClubId;

  // Still null — pick first membership and save it
  const membership = await prisma.clubMember.findFirst({
    where: { userId },
    select: { clubId: true },
  });
  if (membership) {
    await prisma.user.update({
      where: { id: userId },
      data: { currentClubId: membership.clubId },
    });
    return membership.clubId;
  }

  return null;
}

export async function getSessionWithClub() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

export function isClubAdmin(session: NonNullable<Awaited<ReturnType<typeof getSessionWithClub>>>) {
  return session.user.clubRole === "ADMIN" || session.user.systemRole === "SUPER_ADMIN";
}

export function isSuperAdmin(session: NonNullable<Awaited<ReturnType<typeof getSessionWithClub>>>) {
  return session.user.systemRole === "SUPER_ADMIN";
}

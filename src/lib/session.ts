import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

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

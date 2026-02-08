import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    EmailProvider({
      server: {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      },
      from: process.env.GMAIL_USER,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { systemRole: true, currentClubId: true },
        });
        token.id = user.id;
        token.systemRole = dbUser?.systemRole || "USER";

        // Check for pending invites and auto-join clubs
        const invites = await prisma.clubInvite.findMany({
          where: { email: user.email! },
        });
        for (const invite of invites) {
          const existing = await prisma.clubMember.findUnique({
            where: { userId_clubId: { userId: user.id, clubId: invite.clubId } },
          });
          if (!existing) {
            await prisma.clubMember.create({
              data: { userId: user.id, clubId: invite.clubId, role: invite.role },
            });
          }
          await prisma.clubInvite.delete({ where: { id: invite.id } });
        }

        // Set current club
        let currentClubId = dbUser?.currentClubId;
        if (!currentClubId) {
          const firstMembership = await prisma.clubMember.findFirst({
            where: { userId: user.id },
            select: { clubId: true },
          });
          currentClubId = firstMembership?.clubId || null;
          if (currentClubId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { currentClubId },
            });
          }
        }
        token.currentClubId = currentClubId;

        // Get club role
        if (currentClubId) {
          const membership = await prisma.clubMember.findUnique({
            where: { userId_clubId: { userId: user.id, clubId: currentClubId } },
          });
          token.clubRole = membership?.role || null;
        } else {
          token.clubRole = null;
        }
      }

      // Handle club switch trigger
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { currentClubId: true, systemRole: true },
        });
        token.systemRole = dbUser?.systemRole || "USER";
        token.currentClubId = dbUser?.currentClubId || null;
        if (token.currentClubId) {
          const membership = await prisma.clubMember.findUnique({
            where: { userId_clubId: { userId: token.id, clubId: token.currentClubId } },
          });
          token.clubRole = membership?.role || null;
        } else {
          token.clubRole = null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.systemRole = token.systemRole;
        session.user.currentClubId = token.currentClubId;
        session.user.clubRole = token.clubRole;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // When a new user signs up, check for invites and auto-join
      const invites = await prisma.clubInvite.findMany({
        where: { email: user.email! },
      });
      for (const invite of invites) {
        await prisma.clubMember.create({
          data: { userId: user.id, clubId: invite.clubId, role: invite.role },
        });
        await prisma.clubInvite.delete({ where: { id: invite.id } });
      }
      // Set first club as current
      if (invites.length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { currentClubId: invites[0].clubId },
        });
      }
    },
  },
};

import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sendEmail } from "./email";

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
    CredentialsProvider({
      id: "credentials",
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
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

      // Refresh user data from DB on every request (handles admin changes without sign-out)
      if (!user && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { name: true, currentClubId: true, systemRole: true },
        });
        if (dbUser) {
          token.name = dbUser.name;
          token.systemRole = dbUser.systemRole || "USER";
          token.currentClubId = dbUser.currentClubId || null;
          if (token.currentClubId) {
            const membership = await prisma.clubMember.findUnique({
              where: { userId_clubId: { userId: token.id, clubId: token.currentClubId } },
            });
            token.clubRole = membership?.role || null;
          } else {
            token.clubRole = null;
          }
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

      // Notify super admins of new user
      const superAdmins = await prisma.user.findMany({
        where: { systemRole: "SUPER_ADMIN" },
        select: { email: true },
      });
      for (const admin of superAdmins) {
        sendEmail(
          admin.email,
          "New User Signup",
          `<p>A new user has signed up: <strong>${user.email}</strong></p>` +
          `<p>Name: ${user.name || "Not set"}</p>` +
          (invites.length > 0
            ? `<p>Auto-joined ${invites.length} club(s) from pending invites.</p>`
            : `<p>No pending invites — they will go through onboarding.</p>`)
        ).catch(() => {});
      }
    },
  },
};

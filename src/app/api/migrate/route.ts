import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const secret = req.headers.get("x-migrate-secret");

  // Require SUPER_ADMIN session or valid cron secret
  const isSuperAdmin = session?.user?.systemRole === "SUPER_ADMIN";
  const hasValidSecret = secret && secret === process.env.CRON_SECRET;

  if (!isSuperAdmin && !hasValidSecret) {
    return NextResponse.json({}, { status: 403 });
  }

  const log: string[] = [];

  // 1. Create default club
  let club = await prisma.club.findUnique({ where: { slug: "default" } });
  if (!club) {
    const settings = await prisma.appSettings.findFirst();
    const clubName = settings?.clubName || "Bourbon Club";
    club = await prisma.club.create({
      data: { name: clubName, slug: "default", description: "Original bourbon club" },
    });
    log.push(`Created default club: ${club.name}`);
  } else {
    log.push(`Default club already exists`);
  }

  // 2. Set clubId on models that need it
  const bourbonResult = await prisma.$executeRaw`
    UPDATE "Bourbon" SET "clubId" = ${club.id} WHERE "clubId" IS NULL OR "clubId" = ''
  `;
  log.push(`Updated ${bourbonResult} bourbons`);

  const meetingResult = await prisma.$executeRaw`
    UPDATE "Meeting" SET "clubId" = ${club.id} WHERE "clubId" IS NULL OR "clubId" = ''
  `;
  log.push(`Updated ${meetingResult} meetings`);

  const pollResult = await prisma.$executeRaw`
    UPDATE "Poll" SET "clubId" = ${club.id} WHERE "clubId" IS NULL OR "clubId" = ''
  `;
  log.push(`Updated ${pollResult} polls`);

  const duesResult = await prisma.$executeRaw`
    UPDATE "DuesPeriod" SET "clubId" = ${club.id} WHERE "clubId" IS NULL OR "clubId" = ''
  `;
  log.push(`Updated ${duesResult} dues periods`);

  const expenseResult = await prisma.$executeRaw`
    UPDATE "Expense" SET "clubId" = ${club.id} WHERE "clubId" IS NULL OR "clubId" = ''
  `;
  log.push(`Updated ${expenseResult} expenses`);

  // 3. Create ClubMember entries for existing users
  let oldRoles: Record<string, string> = {};
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; role: string }>>`
      SELECT id, role::"text" FROM "User" WHERE role IS NOT NULL
    `;
    for (const row of rows) {
      oldRoles[row.id] = row.role;
    }
    log.push(`Read ${Object.keys(oldRoles).length} old user roles`);
  } catch (e) {
    log.push(`Could not read old role column: ${e}`);
  }

  const users = await prisma.user.findMany();
  let membersCreated = 0;
  for (const user of users) {
    const existing = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: user.id, clubId: club.id } },
    });
    if (!existing) {
      const oldRole = oldRoles[user.id];
      await prisma.clubMember.create({
        data: {
          userId: user.id,
          clubId: club.id,
          role: oldRole === "ADMIN" ? "ADMIN" : "MEMBER",
        },
      });
      membersCreated++;
    }

    // Set currentClubId
    if (!user.currentClubId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentClubId: club.id },
      });
    }

    // Promote admins to SUPER_ADMIN
    if (oldRoles[user.id] === "ADMIN" && user.systemRole === "USER") {
      await prisma.user.update({
        where: { id: user.id },
        data: { systemRole: "SUPER_ADMIN" },
      });
      log.push(`Promoted ${user.email} to SUPER_ADMIN`);
    }
  }
  log.push(`Created ${membersCreated} club memberships`);

  // 4. Migrate AppSettings
  const clubSettings = await prisma.appSettings.findUnique({ where: { clubId: club.id } });
  if (!clubSettings) {
    try {
      const oldSettings = await prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT * FROM "AppSettings" WHERE "id" = 'default'
      `;
      if (oldSettings.length > 0) {
        const s = oldSettings[0];
        await prisma.appSettings.create({
          data: {
            clubId: club.id,
            clubName: (s.clubName as string) || "Bourbon Club",
            venmoHandle: (s.venmoHandle as string) || null,
            paypalEmail: (s.paypalEmail as string) || null,
            reminderDaysBefore: (s.reminderDaysBefore as number) || 7,
          },
        });
        log.push("Migrated app settings");
      }
    } catch {
      log.push("No old settings to migrate");
    }
  }

  return NextResponse.json({ ok: true, log });
}

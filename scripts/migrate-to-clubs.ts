/**
 * One-time migration script to convert single-tenant data to multi-tenant.
 *
 * Run with: npx tsx scripts/migrate-to-clubs.ts
 *
 * This script:
 * 1. Creates a "default" club for existing data
 * 2. Migrates all users to ClubMember entries (preserving roles)
 * 3. Sets clubId on all Bourbons, Meetings, Polls, DuesPeriods, Expenses
 * 4. Migrates AppSettings to reference the default club
 * 5. Sets the first admin user as SUPER_ADMIN
 * 6. Sets currentClubId for all users
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting multi-tenant migration...");

  // 1. Create default club
  let club = await prisma.club.findUnique({ where: { slug: "default" } });
  if (!club) {
    // Try to get the club name from existing settings
    const settings = await prisma.appSettings.findFirst();
    const clubName = settings?.clubName || "Bourbon Club";

    club = await prisma.club.create({
      data: {
        name: clubName,
        slug: "default",
        description: "Original bourbon club",
      },
    });
    console.log(`Created default club: ${club.name} (${club.id})`);
  } else {
    console.log(`Default club already exists: ${club.id}`);
  }

  // 2. Migrate users to ClubMember entries
  // We need to read the old 'role' column if it still exists
  // Since we changed the schema, the old 'role' field is gone.
  // We'll use raw SQL to check if the column exists and read from it.
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users to migrate`);

  // Try to read old roles via raw SQL
  let oldRoles: Record<string, string> = {};
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; role: string }>>`
      SELECT id, role FROM "User"
    `;
    for (const row of rows) {
      oldRoles[row.id] = row.role;
    }
  } catch {
    console.log("Could not read old role column, defaulting all to MEMBER");
  }

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
      console.log(`  Added ${user.email} as ${oldRole === "ADMIN" ? "ADMIN" : "MEMBER"}`);
    }

    // Set currentClubId
    if (!user.currentClubId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentClubId: club.id },
      });
    }

    // Promote first admin to SUPER_ADMIN
    if (oldRoles[user.id] === "ADMIN" && user.systemRole === "USER") {
      await prisma.user.update({
        where: { id: user.id },
        data: { systemRole: "SUPER_ADMIN" },
      });
      console.log(`  Promoted ${user.email} to SUPER_ADMIN`);
    }
  }

  // 3. Set clubId on bourbons
  const bourbonsUpdated = await prisma.bourbon.updateMany({
    where: { clubId: "" },
    data: { clubId: club.id },
  });
  // If that doesn't work (clubId might be null initially), try this approach:
  const bourbonsNull = await prisma.$executeRaw`
    UPDATE "Bourbon" SET "clubId" = ${club.id} WHERE "clubId" IS NULL OR "clubId" = ''
  `;
  console.log(`Updated bourbons: ${bourbonsUpdated.count + bourbonsNull}`);

  // 4. Set clubId on meetings
  await prisma.$executeRaw`
    UPDATE "Meeting" SET "clubId" = ${club.id} WHERE "clubId" IS NULL OR "clubId" = ''
  `;
  console.log("Updated meetings");

  // 5. Set clubId on polls
  await prisma.$executeRaw`
    UPDATE "Poll" SET "clubId" = ${club.id} WHERE "clubId" IS NULL OR "clubId" = ''
  `;
  console.log("Updated polls");

  // 6. Set clubId on dues periods
  await prisma.$executeRaw`
    UPDATE "DuesPeriod" SET "clubId" = ${club.id} WHERE "clubId" IS NULL OR "clubId" = ''
  `;
  console.log("Updated dues periods");

  // 7. Set clubId on expenses
  await prisma.$executeRaw`
    UPDATE "Expense" SET "clubId" = ${club.id} WHERE "clubId" IS NULL OR "clubId" = ''
  `;
  console.log("Updated expenses");

  // 8. Migrate AppSettings
  const existingSettings = await prisma.appSettings.findFirst();
  if (existingSettings) {
    // Check if there's already a club setting
    const clubSettings = await prisma.appSettings.findUnique({ where: { clubId: club.id } });
    if (!clubSettings) {
      await prisma.appSettings.create({
        data: {
          clubId: club.id,
          clubName: existingSettings.clubName,
          venmoHandle: existingSettings.venmoHandle,
          paypalEmail: existingSettings.paypalEmail,
          reminderDaysBefore: existingSettings.reminderDaysBefore,
        },
      });
      // Delete old settings with id "default" if it exists
      try {
        await prisma.$executeRaw`DELETE FROM "AppSettings" WHERE "id" = 'default'`;
      } catch {
        // ignore
      }
      console.log("Migrated app settings");
    }
  }

  console.log("Migration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

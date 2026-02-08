import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable" });
const prisma = new PrismaClient({ adapter });

async function main() {
  // App settings
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", clubName: "Bourbon Club", reminderDaysBefore: 7 },
  });
  console.log("Seeded app settings");

  // Make rmorales admin
  await prisma.user.upsert({
    where: { email: "rmorales.austin@gmail.com" },
    update: { role: "ADMIN", name: "R Morales" },
    create: { email: "rmorales.austin@gmail.com", name: "R Morales", role: "ADMIN" },
  });
  console.log("Made rmorales admin");

  // Bourbons (sequential to avoid connection limit)
  const bourbonData = [
    { id: "bourbon-1", name: "Buffalo Trace", distillery: "Buffalo Trace Distillery", proof: 90, cost: 25, type: "BOURBON" as const, region: "Kentucky", age: 8 },
    { id: "bourbon-2", name: "Woodford Reserve", distillery: "Woodford Reserve Distillery", proof: 90.4, cost: 35, type: "BOURBON" as const, region: "Kentucky", age: 7 },
    { id: "bourbon-3", name: "Maker's Mark", distillery: "Maker's Mark Distillery", proof: 90, cost: 28, type: "WHEAT" as const, region: "Kentucky", age: 6 },
    { id: "bourbon-4", name: "Wild Turkey 101", distillery: "Wild Turkey Distillery", proof: 101, cost: 22, type: "BOURBON" as const, region: "Kentucky", age: 6 },
    { id: "bourbon-5", name: "Bulleit Rye", distillery: "Bulleit Distilling Co", proof: 90, cost: 30, type: "RYE" as const, region: "Kentucky", age: 4 },
    { id: "bourbon-6", name: "Four Roses Single Barrel", distillery: "Four Roses Distillery", proof: 100, cost: 42, type: "BOURBON" as const, region: "Kentucky", age: 7 },
    { id: "bourbon-7", name: "Elijah Craig Small Batch", distillery: "Heaven Hill Distillery", proof: 94, cost: 30, type: "BOURBON" as const, region: "Kentucky", age: 8 },
    { id: "bourbon-8", name: "Blanton's Original", distillery: "Buffalo Trace Distillery", proof: 93, cost: 65, secondaryCost: 120, type: "BOURBON" as const, region: "Kentucky", age: 6 },
  ];

  for (const b of bourbonData) {
    await prisma.bourbon.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }
  console.log(`Seeded ${bourbonData.length} bourbons`);

  // Poll
  await prisma.poll.upsert({
    where: { id: "poll-1" },
    update: {},
    create: { id: "poll-1", title: "February Tasting Night", status: "OPEN" },
  });
  const optionDates = [
    { id: "option-1", date: new Date("2026-02-14T19:00:00") },
    { id: "option-2", date: new Date("2026-02-21T19:00:00") },
    { id: "option-3", date: new Date("2026-02-28T19:00:00") },
  ];
  for (const o of optionDates) {
    await prisma.pollOption.upsert({
      where: { id: o.id },
      update: {},
      create: { id: o.id, pollId: "poll-1", date: o.date },
    });
  }
  console.log("Seeded poll with 3 date options");

  // Meeting
  await prisma.meeting.upsert({
    where: { id: "meeting-1" },
    update: {},
    create: {
      id: "meeting-1",
      title: "Buffalo Trace Lineup Tasting",
      date: new Date("2026-03-01T19:00:00"),
      description: "Tasting through the Buffalo Trace distillery lineup including Blanton's and Elijah Craig.",
      location: "Matt's house",
    },
  });
  const meetingBourbons = ["bourbon-1", "bourbon-8", "bourbon-7"];
  for (const bid of meetingBourbons) {
    await prisma.meetingBourbon.upsert({
      where: { meetingId_bourbonId: { meetingId: "meeting-1", bourbonId: bid } },
      update: {},
      create: { meetingId: "meeting-1", bourbonId: bid },
    });
  }
  console.log("Seeded meeting with 3 bourbons");

  // Dues period
  await prisma.duesPeriod.upsert({
    where: { id: "dues-1" },
    update: {},
    create: { id: "dues-1", name: "Q1 2026 Dues", amount: 50, dueDate: new Date("2026-03-01"), frequency: "QUARTERLY" },
  });
  console.log("Seeded dues period");

  // Expenses
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "rmorales.austin@gmail.com" } });
  const expenseData = [
    { id: "expense-1", description: "Blanton's Original for March tasting", amount: 65, date: new Date("2026-02-15"), category: "BOURBON_PURCHASE" as const, notes: "Found at Total Wine", recordedById: admin.id },
    { id: "expense-2", description: "Glencairn glasses (set of 8)", amount: 42, date: new Date("2026-02-10"), category: "SUPPLIES" as const, notes: null, recordedById: admin.id },
    { id: "expense-3", description: "Snacks and mixers for February meetup", amount: 35.50, date: new Date("2026-02-20"), category: "FOOD_DRINK" as const, notes: "Cheese board + crackers + ginger beer", recordedById: admin.id },
  ];
  for (const e of expenseData) {
    await prisma.expense.upsert({
      where: { id: e.id },
      update: {},
      create: e,
    });
  }
  console.log(`Seeded ${expenseData.length} expenses`);

  console.log("Done!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

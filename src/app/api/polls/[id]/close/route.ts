import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { id } = await params;
  const { selectedOptionId, createMeeting } = await req.json();

  // Mark the selected option
  await prisma.pollOption.update({
    where: { id: selectedOptionId },
    data: { selected: true },
  });

  // Close the poll
  await prisma.poll.update({
    where: { id },
    data: { status: "CLOSED" },
  });

  // Optionally create a meeting from the selected date
  if (createMeeting) {
    const option = await prisma.pollOption.findUnique({ where: { id: selectedOptionId } });
    const poll = await prisma.poll.findUnique({ where: { id } });
    if (option && poll) {
      await prisma.meeting.create({
        data: {
          title: poll.title,
          date: option.date,
          pollId: id,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}

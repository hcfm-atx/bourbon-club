import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
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

  // Optionally create a meeting from the selected option
  if (createMeeting) {
    const option = await prisma.pollOption.findUnique({ where: { id: selectedOptionId } });
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: { options: { where: { selected: true } } },
    });
    if (option && poll) {
      if (poll.type === "BOURBON") {
        // For bourbon polls: create meeting at current date, attach selected bourbon(s)
        const selectedOptions = await prisma.pollOption.findMany({
          where: { pollId: id, selected: true },
        });
        await prisma.meeting.create({
          data: {
            clubId: poll.clubId,
            title: poll.title,
            date: new Date(),
            pollId: id,
            bourbons: {
              create: selectedOptions
                .filter((o) => o.bourbonId)
                .map((o) => ({ bourbonId: o.bourbonId! })),
            },
          },
        });
      } else {
        // DATE poll: use the selected date
        await prisma.meeting.create({
          data: {
            clubId: poll.clubId,
            title: poll.title,
            date: option.date!,
            pollId: id,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

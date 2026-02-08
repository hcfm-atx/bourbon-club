import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const polls = await prisma.poll.findMany({
    include: {
      options: { include: { votes: true }, orderBy: { date: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(polls);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { title, dates } = await req.json();
  const poll = await prisma.poll.create({
    data: {
      title,
      options: {
        create: (dates as string[]).map((date) => ({ date: new Date(date) })),
      },
    },
    include: { options: true },
  });
  return NextResponse.json(poll);
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const meetings = await prisma.meeting.findMany({
    include: {
      bourbons: { include: { bourbon: true } },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { title, date, description, location } = await req.json();
  const meeting = await prisma.meeting.create({
    data: { title, date: new Date(date + "T12:00:00Z"), description, location },
  });
  return NextResponse.json(meeting);
}

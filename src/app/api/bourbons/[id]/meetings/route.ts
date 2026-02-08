import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { id: bourbonId } = await params;
  const { meetingId } = await req.json();

  const existing = await prisma.meetingBourbon.findUnique({
    where: { meetingId_bourbonId: { meetingId, bourbonId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already assigned" }, { status: 400 });
  }

  const mb = await prisma.meetingBourbon.create({
    data: { meetingId, bourbonId },
  });
  return NextResponse.json(mb);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const { id: bourbonId } = await params;
  const { meetingId } = await req.json();

  await prisma.meetingBourbon.delete({
    where: { meetingId_bourbonId: { meetingId, bourbonId } },
  });
  return NextResponse.json({ ok: true });
}

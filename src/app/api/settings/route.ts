import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
  return NextResponse.json(settings || { clubName: "Bourbon Club", reminderDaysBefore: 7 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({}, { status: 403 });
  }

  const data = await req.json();
  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  return NextResponse.json(settings);
}

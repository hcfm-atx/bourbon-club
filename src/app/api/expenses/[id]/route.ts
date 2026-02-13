import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClubAdmin, getClubId } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  const { id } = await params;

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing || existing.clubId !== clubId) return NextResponse.json({}, { status: 404 });

  const { description, amount, date, category, notes } = await req.json();

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      description,
      amount,
      date: new Date(date),
      category: category || null,
      notes: notes || null,
    },
    include: { recordedBy: { select: { id: true, name: true } } },
  });
  return NextResponse.json(expense);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isClubAdmin(session)) {
    return NextResponse.json({}, { status: 403 });
  }

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  const { id } = await params;

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing || existing.clubId !== clubId) return NextResponse.json({}, { status: 404 });

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

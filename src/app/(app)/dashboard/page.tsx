import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Vote, Star, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const clubId = session?.user?.id
    ? await getClubId(session.user.id, session.user.currentClubId)
    : null;

  const [nextMeeting, openPolls, reviewCount, paidPayments, allExpenses, bourbonsWithImages] = await Promise.all([
    prisma.meeting.findFirst({
      where: { clubId: clubId ?? undefined, date: { gte: new Date() } },
      orderBy: { date: "asc" },
    }),
    prisma.poll.count({ where: { clubId: clubId ?? undefined, status: "OPEN" } }),
    prisma.review.count({ where: { userId: session?.user?.id, bourbon: { clubId: clubId ?? undefined } } }),
    prisma.payment.findMany({
      where: { paid: true, duesPeriod: { clubId: clubId ?? undefined } },
      include: { duesPeriod: { select: { amount: true } } },
    }),
    prisma.expense.aggregate({ where: { clubId: clubId ?? undefined }, _sum: { amount: true } }),
    prisma.bourbon.findMany({
      where: { clubId: clubId ?? undefined, imageUrl: { not: null } },
      select: { id: true, name: true, imageUrl: true, distillery: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const totalCollected = paidPayments.reduce((sum, p) => sum + p.duesPeriod.amount, 0);
  const totalExpenses = allExpenses._sum.amount ?? 0;
  const balance = totalCollected - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden h-56 md:h-80">
        <Image
          src="/glen_hero.jpeg"
          alt="Bourbon tasting"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <p className="text-amber-400 text-xs tracking-widest uppercase font-medium mb-1">
            Welcome back
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            {session?.user?.name || "Member"}
          </h1>
          <p className="text-white/60 text-sm mt-1">Your bourbon club at a glance</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/meetings">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-amber-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Next Meeting</CardTitle>
              <CalendarDays className="w-4 h-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              {nextMeeting ? (
                <>
                  <p className="text-lg font-bold leading-tight">{nextMeeting.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {nextMeeting.date.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" })}
                  </p>
                </>
              ) : (
                <p className="text-lg font-bold text-muted-foreground">None scheduled</p>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/polls">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Polls</CardTitle>
              <Vote className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{openPolls}</p>
              <p className="text-xs text-muted-foreground mt-0.5">awaiting your vote</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/ratings">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Your Reviews</CardTitle>
              <Star className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reviewCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">bourbons reviewed</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Treasury Balance</CardTitle>
            <Wallet className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${balance.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">club funds</p>
          </CardContent>
        </Card>
      </div>

      {bourbonsWithImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Collection</h2>
            <Link href="/bourbons" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {bourbonsWithImages.map((b) => (
              <Link key={b.id} href={`/bourbons/${b.id}`}>
                <Card className="hover:shadow-md transition-shadow overflow-hidden">
                  <div className="relative h-48 w-full">
                    <Image
                      src={b.imageUrl!}
                      alt={b.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm">{b.name}</p>
                    {b.distillery && (
                      <p className="text-xs text-muted-foreground">{b.distillery}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

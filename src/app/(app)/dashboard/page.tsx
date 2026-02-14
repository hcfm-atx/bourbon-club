import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Vote, Star, Wallet, CreditCard, Flame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ActivityFeed } from "@/components/activity-feed";
import { MemberCard } from "@/components/member-card";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const clubId = session?.user?.id
    ? await getClubId(session.user.id, session.user.currentClubId)
    : null;

  const [nextMeeting, openPolls, reviewCount, paidPayments, allExpenses, bourbonsWithImages, recentReviews, recentPolls, recentPayments, userRsvps, featuredReview] = await Promise.all([
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
    prisma.review.findMany({
      where: { bourbon: { clubId: clubId ?? undefined } },
      select: {
        id: true,
        rating: true,
        createdAt: true,
        user: { select: { name: true } },
        bourbon: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.poll.findMany({
      where: { clubId: clubId ?? undefined },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.payment.findMany({
      where: { paid: true, duesPeriod: { clubId: clubId ?? undefined } },
      select: {
        id: true,
        paidAt: true,
        createdAt: true,
        user: { select: { name: true } },
        duesPeriod: { select: { amount: true } },
      },
      orderBy: { paidAt: "desc" },
      take: 10,
    }),
    prisma.meetingRsvp.findMany({
      where: {
        userId: session?.user?.id,
        status: { in: ["GOING", "MAYBE"] },
        meeting: {
          clubId: clubId ?? undefined,
          date: { lte: new Date() },
        },
      },
      include: {
        meeting: { select: { date: true } },
      },
      orderBy: {
        meeting: { date: "desc" },
      },
    }),
    prisma.review.findFirst({
      where: {
        bourbon: { clubId: clubId ?? undefined },
        OR: [
          { notes: { not: "" } },
          { nose: { not: "" } },
          { palate: { not: "" } },
          { finish: { not: "" } },
        ],
        NOT: [
          { notes: null, nose: null, palate: null, finish: null },
        ],
      },
      select: {
        id: true,
        notes: true,
        nose: true,
        palate: true,
        finish: true,
        createdAt: true,
        user: { select: { name: true } },
        bourbon: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalCollected = paidPayments.reduce((sum, p) => sum + p.duesPeriod.amount, 0);
  const totalExpenses = allExpenses._sum.amount ?? 0;
  const balance = totalCollected - totalExpenses;

  // Calculate current streak
  const allMeetings = await prisma.meeting.findMany({
    where: {
      clubId: clubId ?? undefined,
      date: { lte: new Date() },
    },
    include: {
      rsvps: {
        where: { userId: session?.user?.id },
      },
    },
    orderBy: { date: "desc" },
  });

  let currentStreak = 0;
  for (const meeting of allMeetings) {
    const rsvp = meeting.rsvps[0];
    if (rsvp && (rsvp.status === "GOING" || rsvp.status === "MAYBE")) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Merge and sort activity feed events
  type ActivityEvent = {
    id: string;
    type: "review" | "poll" | "payment";
    description: string;
    createdAt: Date;
  };

  const activityEvents: ActivityEvent[] = [
    ...recentReviews.map((r) => ({
      id: r.id,
      type: "review" as const,
      description: `${r.user.name || "Someone"} rated ${r.bourbon.name} ${r.rating.toFixed(1)}/10`,
      createdAt: r.createdAt,
    })),
    ...recentPolls.map((p) => ({
      id: p.id,
      type: "poll" as const,
      description: `New poll: ${p.title}`,
      createdAt: p.createdAt,
    })),
    ...recentPayments.map((p) => ({
      id: p.id,
      type: "payment" as const,
      description: `${p.user.name || "Someone"} paid $${p.duesPeriod.amount.toFixed(2)} dues`,
      createdAt: p.paidAt || p.createdAt,
    })),
  ];

  const sortedActivity = activityEvents
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="relative rounded-3xl overflow-hidden h-64 md:h-96 group">
        <Image
          src="/glen_hero.jpeg"
          alt="Bourbon tasting"
          fill
          className="object-cover object-center transition-transform duration-[8000ms] ease-out group-hover:scale-105"
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54releontdoQf/9k="
        />
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12">
          {/* Accent bar */}
          <div className="w-12 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mb-4 rounded-full" />

          <p className="text-amber-400 text-xs md:text-sm tracking-[0.2em] uppercase font-semibold mb-2">
            Welcome back
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-2">
            {session?.user?.name || "Member"}
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-xl font-light tracking-wide">
            Your bourbon club at a glance
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Link href="/meetings">
          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-amber-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Next Meeting</CardTitle>
              <CalendarDays className="w-5 h-5 text-amber-600" />
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
          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Polls</CardTitle>
              <Vote className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{openPolls}</p>
              <p className="text-xs text-muted-foreground mt-0.5">awaiting your vote</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/ratings">
          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Your Reviews</CardTitle>
              <Star className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reviewCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">bourbons reviewed</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Treasury Balance</CardTitle>
            <Wallet className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${balance.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">club funds</p>
          </CardContent>
        </Card>
        <Link href="/profile">
          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
              <Flame className="w-5 h-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground mt-0.5">meetings in a row</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {sortedActivity.length > 0 && (
        <ActivityFeed events={sortedActivity.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))} />
      )}

      {featuredReview && (
        <Card className="border-l-4 border-l-amber-600">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">Featured Tasting Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <blockquote className="text-lg md:text-xl italic text-foreground leading-relaxed">
              "{featuredReview.notes || featuredReview.nose || featuredReview.palate || featuredReview.finish}"
            </blockquote>
            <div className="flex items-center justify-between text-sm">
              <Link href={`/bourbons/${featuredReview.bourbon.id}`} className="text-amber-600 hover:text-amber-700 font-medium">
                {featuredReview.bourbon.name}
              </Link>
              <span className="text-muted-foreground">
                — {featuredReview.user.name || "Anonymous"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {clubId && (async () => {
        // Get a random active member (with at least 1 review)
        const activeMembers = await prisma.user.findMany({
          where: {
            memberships: { some: { clubId } },
            reviews: { some: { bourbon: { clubId } } },
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            memberships: {
              where: { clubId },
              select: { role: true },
            },
            _count: {
              select: {
                reviews: { where: { bourbon: { clubId } } },
                rsvps: {
                  where: {
                    meeting: { clubId },
                    status: { in: ["GOING", "MAYBE"] },
                  },
                },
              },
            },
            reviews: {
              where: { bourbon: { clubId } },
              orderBy: { rating: "desc" },
              take: 1,
              include: { bourbon: { select: { name: true } } },
            },
          },
        });

        if (activeMembers.length === 0) return null;

        const randomMember = activeMembers[Math.floor(Math.random() * activeMembers.length)];

        // Calculate current streak for spotlight member
        const spotlightMeetings = await prisma.meeting.findMany({
          where: { clubId, date: { lte: new Date() } },
          include: {
            rsvps: { where: { userId: randomMember.id } },
          },
          orderBy: { date: "desc" },
        });

        let spotlightStreak = 0;
        for (const meeting of spotlightMeetings) {
          const rsvp = meeting.rsvps[0];
          if (rsvp && (rsvp.status === "GOING" || rsvp.status === "MAYBE")) {
            spotlightStreak++;
          } else {
            break;
          }
        }

        const memberData = {
          id: randomMember.id,
          name: randomMember.name,
          email: randomMember.email,
          createdAt: randomMember.createdAt,
          role: randomMember.memberships[0]?.role,
          reviewCount: randomMember._count.reviews,
          meetingCount: randomMember._count.rsvps,
          currentStreak: spotlightStreak,
          favoriteBourbon: randomMember.reviews[0]
            ? {
                name: randomMember.reviews[0].bourbon.name,
                rating: randomMember.reviews[0].rating,
              }
            : null,
        };

        const latestReview = randomMember.reviews[0];

        return (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Member Spotlight</h2>
            <MemberCard member={memberData} />
            {latestReview && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-1">Most recent review</p>
                  <p className="font-medium">{latestReview.bourbon.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{latestReview.rating.toFixed(1)}/10</span>
                    </div>
                    {latestReview.notes && (
                      <p className="text-sm text-muted-foreground truncate">"{latestReview.notes}"</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}

      {bourbonsWithImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Collection</h2>
            <Link href="/bourbons" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="masonry">
            {bourbonsWithImages.map((b) => (
              <Link key={b.id} href={`/bourbons/${b.id}`}>
                <Card className="hover:shadow-md hover:scale-[1.02] transition-transform duration-200 overflow-hidden">
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <Image
                      src={b.imageUrl!}
                      alt={b.name}
                      fill
                      className="object-cover transition-opacity duration-500"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54releontdoQf/9k="
                      sizes="(max-width: 768px) 50vw, 33vw"
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

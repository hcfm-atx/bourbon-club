import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Star, Vote, CreditCard, Activity } from "lucide-react";

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);

  const clubId = session?.user?.id
    ? await getClubId(session.user.id, session.user.currentClubId)
    : null;

  const [reviews, polls, payments] = await Promise.all([
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
      take: 50,
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
      take: 20,
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
      take: 20,
    }),
  ]);

  type ActivityEvent = {
    id: string;
    type: "review" | "poll" | "payment";
    description: string;
    createdAt: Date;
  };

  const events: ActivityEvent[] = [
    ...reviews.map((r) => ({
      id: r.id,
      type: "review" as const,
      description: `${r.user.name || "Someone"} rated ${r.bourbon.name} ${r.rating.toFixed(1)}/10`,
      createdAt: r.createdAt,
    })),
    ...polls.map((p) => ({
      id: p.id,
      type: "poll" as const,
      description: `New poll: ${p.title}`,
      createdAt: p.createdAt,
    })),
    ...payments.map((p) => ({
      id: p.id,
      type: "payment" as const,
      description: `${p.user.name || "Someone"} paid $${p.duesPeriod.amount.toFixed(2)} dues`,
      createdAt: p.paidAt || p.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Club Activity</h1>

      {events.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="When members review bourbons, vote on polls, or pay dues, activity will appear here."
        />
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {events.map((event, index) => {
                const isLast = index === events.length - 1;
                const iconColor = event.type === "review" ? "bg-amber-500" : event.type === "poll" ? "bg-blue-500" : "bg-green-500";
                const Icon = event.type === "review" ? Star : event.type === "poll" ? Vote : CreditCard;

                return (
                  <div key={event.id} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className={`${iconColor} rounded-full p-2 flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      {!isLast && (
                        <div className="w-px h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getRelativeTime(event.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

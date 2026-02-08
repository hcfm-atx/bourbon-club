import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const [nextMeeting, openPolls, reviewCount, paidPayments, allExpenses] = await Promise.all([
    prisma.meeting.findFirst({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
    }),
    prisma.poll.count({ where: { status: "OPEN" } }),
    prisma.review.count({ where: { userId: session?.user?.id } }),
    prisma.payment.findMany({
      where: { paid: true },
      include: { duesPeriod: { select: { amount: true } } },
    }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  const totalCollected = paidPayments.reduce((sum, p) => sum + p.duesPeriod.amount, 0);
  const totalExpenses = allExpenses._sum.amount ?? 0;
  const balance = totalCollected - totalExpenses;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome, {session?.user?.name || "Member"}</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/meetings">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Next Meeting</CardTitle>
            </CardHeader>
            <CardContent>
              {nextMeeting ? (
                <>
                  <p className="text-xl font-bold">{nextMeeting.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {nextMeeting.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                </>
              ) : (
                <p className="text-xl font-bold">None scheduled</p>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/polls">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Polls</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{openPolls}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/ratings">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Your Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{reviewCount}</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Treasury Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

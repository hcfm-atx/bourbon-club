"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useSession } from "next-auth/react";
import { Vote } from "lucide-react";

interface Poll {
  id: string;
  title: string;
  type: "DATE" | "BOURBON";
  status: "OPEN" | "CLOSED";
  options: { id: string; date: string | null; label: string | null; selected: boolean; votes: { id: string; userId: string }[] }[];
}

export default function PollsPage() {
  const { data: session } = useSession();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/polls")
      .then((r) => r.json())
      .then(setPolls)
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = session?.user?.clubRole === "ADMIN" || session?.user?.systemRole === "SUPER_ADMIN";

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Polls</h1>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Polls</h1>
      <div className="grid gap-4">
        {polls.map((poll) => (
          <Card key={poll.id}>
            <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-base md:text-lg">{poll.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={poll.status === "OPEN" ? "default" : "secondary"}>{poll.status}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {poll.type === "BOURBON" ? "Bourbon" : "Date"} Poll
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  {poll.options.length} options
                  {" · "}{poll.options.reduce((sum, o) => sum + o.votes.length, 0)} votes
                  {session?.user?.id && poll.options.some(o => o.votes.some(v => v.userId === session.user.id)) && (
                    <Badge variant="outline" className="ml-2 text-green-600 border-green-600">Voted</Badge>
                  )}
                </div>
                <Link href={`/polls/${poll.id}`} className="w-full sm:w-auto">
                  <Button size="sm" variant={poll.status === "OPEN" ? "default" : "outline"} className="w-full sm:w-auto min-h-[44px]">
                    {poll.status === "OPEN" ? "Vote Now" : "View Results"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {polls.length === 0 && (
          <EmptyState
            icon={Vote}
            title="No polls yet"
            description="There are no polls available at the moment. Check back soon or contact an admin to create one."
            actionLabel={isAdmin ? "Create a Poll" : undefined}
            actionHref={isAdmin ? "/admin/polls" : undefined}
          />
        )}
      </div>
    </div>
  );
}
